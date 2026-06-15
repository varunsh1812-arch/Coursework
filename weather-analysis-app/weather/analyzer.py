"""Descriptive statistics, trends and correlations for fetched weather data."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from .fetcher import WeatherData

# WMO weather interpretation codes -> human-readable description.
WMO_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def describe_weather_code(code: Any) -> str:
    """Map a WMO weather code to a readable description."""
    try:
        return WMO_CODES.get(int(code), f"Unknown ({code})")
    except (TypeError, ValueError):
        return "Unknown"


def aqi_category(us_aqi: Any) -> str:
    """US EPA category label for a US AQI value."""
    try:
        v = float(us_aqi)
    except (TypeError, ValueError):
        return "Unknown"
    bands = [
        (50, "Good"),
        (100, "Moderate"),
        (150, "Unhealthy for sensitive groups"),
        (200, "Unhealthy"),
        (300, "Very unhealthy"),
        (float("inf"), "Hazardous"),
    ]
    for limit, label in bands:
        if v <= limit:
            return label
    return "Unknown"


@dataclass
class Analysis:
    """Computed insights derived from a :class:`WeatherData` object."""

    summary: dict[str, Any]
    hourly_stats: pd.DataFrame
    daily_stats: pd.DataFrame
    correlations: pd.DataFrame
    temp_trend_per_day: float


def _linear_trend_per_day(series: pd.Series) -> float:
    """Slope of a least-squares fit (units per day) for a time-indexed series."""
    clean = series.dropna()
    if len(clean) < 2:
        return 0.0
    # Convert timestamps to fractional days since the first observation.
    x = (clean.index - clean.index[0]).total_seconds().to_numpy() / 86400.0
    slope, _ = np.polyfit(x, clean.to_numpy(dtype=float), 1)
    return float(slope)


def analyze(data: WeatherData) -> Analysis:
    """Compute summary statistics, trends and correlations."""
    hourly = data.hourly
    daily = data.daily

    summary: dict[str, Any] = {
        "location": data.location.label,
        "latitude": data.location.latitude,
        "longitude": data.location.longitude,
        "source": data.source,
        "current_temperature": data.current.get("temperature_2m"),
        "current_apparent": data.current.get("apparent_temperature"),
        "current_humidity": data.current.get("relative_humidity_2m"),
        "current_wind": data.current.get("wind_speed_10m"),
        "current_conditions": describe_weather_code(data.current.get("weather_code")),
    }

    if not hourly.empty and "temperature_2m" in hourly:
        temps = hourly["temperature_2m"]
        summary.update(
            {
                "mean_temp": round(float(temps.mean()), 1),
                "min_temp": round(float(temps.min()), 1),
                "max_temp": round(float(temps.max()), 1),
                "warmest_hour": temps.idxmax().isoformat(),
                "coldest_hour": temps.idxmin().isoformat(),
            }
        )
    if not hourly.empty and "precipitation" in hourly:
        summary["total_precipitation"] = round(float(hourly["precipitation"].sum()), 1)
    if not hourly.empty and "relative_humidity_2m" in hourly:
        summary["mean_humidity"] = round(float(hourly["relative_humidity_2m"].mean()), 1)

    # Day length from sunrise/sunset (hours), if available.
    if not daily.empty and {"sunrise", "sunset"}.issubset(daily.columns):
        sunrise = pd.to_datetime(daily["sunrise"])
        sunset = pd.to_datetime(daily["sunset"])
        day_hours = (sunset - sunrise).dt.total_seconds() / 3600.0
        summary["mean_daylight_hours"] = round(float(day_hours.mean()), 1)
        summary["longest_day"] = day_hours.idxmax().date().isoformat()

    # Air-quality summary, if available.
    if not data.air_quality.empty:
        aq = data.air_quality
        if "us_aqi" in aq:
            peak = float(aq["us_aqi"].max())
            summary["max_us_aqi"] = round(peak, 0)
            summary["aqi_category"] = aqi_category(peak)
        if "pm2_5" in aq:
            summary["mean_pm2_5"] = round(float(aq["pm2_5"].mean()), 1)

    hourly_stats = hourly.describe().round(2) if not hourly.empty else pd.DataFrame()

    daily_stats = pd.DataFrame()
    if not daily.empty:
        numeric_daily = daily.select_dtypes(include="number")
        daily_stats = numeric_daily.describe().round(2)

    # Correlate the key hourly drivers.
    corr_cols = [
        c
        for c in ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"]
        if c in hourly.columns
    ]
    correlations = (
        hourly[corr_cols].corr().round(2) if len(corr_cols) >= 2 else pd.DataFrame()
    )

    temp_trend = (
        _linear_trend_per_day(hourly["temperature_2m"])
        if "temperature_2m" in hourly.columns
        else 0.0
    )

    return Analysis(
        summary=summary,
        hourly_stats=hourly_stats,
        daily_stats=daily_stats,
        correlations=correlations,
        temp_trend_per_day=round(temp_trend, 3),
    )
