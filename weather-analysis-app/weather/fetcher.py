"""Download live weather data from the Open-Meteo forecast API.

Open-Meteo is free, requires no API key, and returns current conditions,
hourly series and daily aggregates in a single request. We also ask for a
few past days so the analysis covers recent history as well as the forecast.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd
import requests

from .geocoder import Location

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

HOURLY_VARS = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation",
    "precipitation_probability",
    "wind_speed_10m",
    "wind_direction_10m",
]
AIR_QUALITY_VARS = ["pm2_5", "pm10", "us_aqi", "ozone"]
DAILY_VARS = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "wind_speed_10m_max",
    "sunrise",
    "sunset",
]
CURRENT_VARS = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
]


@dataclass
class WeatherData:
    """All fetched data for one location, tidied into pandas frames."""

    location: Location
    current: dict[str, Any]
    hourly: pd.DataFrame
    daily: pd.DataFrame
    units: dict[str, str] = field(default_factory=dict)
    source: str = "live"  # "live", "offline-sample" or "cache"
    air_quality: pd.DataFrame = field(default_factory=pd.DataFrame)
    air_quality_current: dict[str, Any] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)
    raw_air_quality: dict[str, Any] = field(default_factory=dict)


def _frame_from_block(block: dict[str, Any]) -> pd.DataFrame:
    """Convert an Open-Meteo time-series block into a DataFrame indexed by time."""
    if not block or "time" not in block:
        return pd.DataFrame()
    frame = pd.DataFrame(block)
    frame["time"] = pd.to_datetime(frame["time"])
    return frame.set_index("time")


def parse_response(payload: dict[str, Any], location: Location, source: str = "live") -> WeatherData:
    """Build a :class:`WeatherData` object from a raw API/sample payload."""
    units = {}
    units.update(payload.get("hourly_units", {}))
    units.update(payload.get("daily_units", {}))
    units.update(payload.get("current_units", {}))

    return WeatherData(
        location=location,
        current=payload.get("current", {}),
        hourly=_frame_from_block(payload.get("hourly", {})),
        daily=_frame_from_block(payload.get("daily", {})),
        units=units,
        source=source,
        raw=payload,
    )


def attach_air_quality(data: WeatherData, payload: dict[str, Any]) -> WeatherData:
    """Attach a parsed air-quality payload to an existing WeatherData object."""
    data.air_quality = _frame_from_block(payload.get("hourly", {}))
    data.air_quality_current = payload.get("current", {})
    data.raw_air_quality = payload
    aq_units = {}
    aq_units.update(payload.get("hourly_units", {}))
    aq_units.update(payload.get("current_units", {}))
    data.units.update(aq_units)
    return data


def fetch_air_quality(location: Location, forecast_days: int = 5, timeout: int = 20) -> dict[str, Any]:
    """Fetch the raw air-quality payload (PM2.5, PM10, US AQI, ozone)."""
    params = {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "timezone": location.timezone or "auto",
        "current": ",".join(AIR_QUALITY_VARS),
        "hourly": ",".join(AIR_QUALITY_VARS),
        "forecast_days": forecast_days,
    }
    response = requests.get(AIR_QUALITY_URL, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def fetch_weather(
    location: Location,
    past_days: int = 7,
    forecast_days: int = 7,
    timeout: int = 20,
    include_air_quality: bool = True,
) -> WeatherData:
    """Fetch live current, hourly and daily weather for *location*.

    If *include_air_quality* is set, also attaches PM2.5/PM10/US-AQI/ozone.
    Air-quality failures are non-fatal — the weather data is still returned.

    Raises
    ------
    requests.RequestException
        On weather-endpoint network failure (caller may fall back to a cache
        or the bundled sample data).
    """
    params = {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "timezone": location.timezone or "auto",
        "current": ",".join(CURRENT_VARS),
        "hourly": ",".join(HOURLY_VARS),
        "daily": ",".join(DAILY_VARS),
        "past_days": past_days,
        "forecast_days": forecast_days,
        "wind_speed_unit": "kmh",
    }
    response = requests.get(FORECAST_URL, params=params, timeout=timeout)
    response.raise_for_status()
    data = parse_response(response.json(), location, source="live")

    if include_air_quality:
        try:
            attach_air_quality(data, fetch_air_quality(location, timeout=timeout))
        except requests.RequestException:
            pass  # Air quality is a bonus; never let it break the run.
    return data
