"""Bundled offline weather snapshot.

A real Open-Meteo response (captured for London) is shipped as JSON next to
this module so the app produces meaningful charts even with no internet
connection. This is what makes the project runnable on any laptop, anywhere,
without an API key or network access.
"""

from __future__ import annotations

import json
import os

from .fetcher import WeatherData, attach_air_quality, parse_response
from .geocoder import Location

_SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_payload.json")


def load_sample() -> WeatherData:
    """Load the bundled snapshot as a :class:`WeatherData` object."""
    with open(_SAMPLE_PATH, encoding="utf-8") as fh:
        blob = json.load(fh)

    loc = blob["location"]
    location = Location(
        name=loc["name"],
        country=loc.get("country", ""),
        latitude=float(loc["latitude"]),
        longitude=float(loc["longitude"]),
        timezone=loc.get("timezone", "auto"),
    )
    data = parse_response(blob["payload"], location, source="offline-sample")
    if blob.get("air_quality_payload"):
        attach_air_quality(data, blob["air_quality_payload"])
    return data
