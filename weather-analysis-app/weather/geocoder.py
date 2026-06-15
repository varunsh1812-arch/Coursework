"""Resolve a human-readable place name to coordinates via Open-Meteo.

The geocoding endpoint is free and requires no API key, which keeps the
whole project runnable on any laptop without registration.
"""

from __future__ import annotations

from dataclasses import dataclass

import requests

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"


@dataclass
class Location:
    """A resolved geographic location."""

    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str

    @property
    def label(self) -> str:
        """Short display label, e.g. 'London, United Kingdom'."""
        return f"{self.name}, {self.country}" if self.country else self.name


def geocode(city: str, timeout: int = 15) -> Location:
    """Look up the best-matching location for *city*.

    Raises
    ------
    LookupError
        If no location matches the query.
    requests.RequestException
        On network failure (caller may fall back to offline data).
    """
    params = {"name": city, "count": 1, "language": "en", "format": "json"}
    response = requests.get(GEOCODE_URL, params=params, timeout=timeout)
    response.raise_for_status()
    results = response.json().get("results")
    if not results:
        raise LookupError(f"No location found for {city!r}.")

    top = results[0]
    return Location(
        name=top.get("name", city),
        country=top.get("country", ""),
        latitude=float(top["latitude"]),
        longitude=float(top["longitude"]),
        timezone=top.get("timezone", "auto"),
    )
