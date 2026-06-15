"""On-disk cache of live fetches.

Every successful live fetch is written here, keyed by location. Offline mode
can then reuse the most recent fetch (or a specific city you've looked up
before) instead of only the single bundled snapshot — so the app stays useful
without a network connection for any place you've already visited.
"""

from __future__ import annotations

import json
import os
import re
import time

from .fetcher import WeatherData, attach_air_quality, parse_response
from .geocoder import Location

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")


def slug(text: str) -> str:
    """Filesystem-safe slug for a location label."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "location"


def _location_dict(loc: Location) -> dict:
    return {
        "name": loc.name,
        "country": loc.country,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "timezone": loc.timezone,
    }


def save(data: WeatherData, cache_dir: str = CACHE_DIR) -> str:
    """Persist a fetched WeatherData (raw payloads) to the cache."""
    os.makedirs(cache_dir, exist_ok=True)
    blob = {
        "location": _location_dict(data.location),
        "payload": data.raw,
        "air_quality_payload": data.raw_air_quality,
        "fetched_at": time.time(),
    }
    path = os.path.join(cache_dir, f"{slug(data.location.label)}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(blob, fh)
    return path


def _build(blob: dict) -> WeatherData:
    loc = blob["location"]
    location = Location(
        name=loc["name"],
        country=loc.get("country", ""),
        latitude=float(loc["latitude"]),
        longitude=float(loc["longitude"]),
        timezone=loc.get("timezone", "auto"),
    )
    data = parse_response(blob["payload"], location, source="cache")
    if blob.get("air_quality_payload"):
        attach_air_quality(data, blob["air_quality_payload"])
    return data


def load_city(city: str, cache_dir: str = CACHE_DIR) -> WeatherData | None:
    """Return cached data for *city* if present, else ``None``.

    Cache files are keyed by full label (e.g. ``tokyo-japan``), so a query of
    just ``Tokyo`` (slug ``tokyo``) is matched as a prefix.
    """
    if not os.path.isdir(cache_dir):
        return None
    want = slug(city)
    exact = os.path.join(cache_dir, f"{want}.json")
    candidates = [exact] if os.path.exists(exact) else []
    candidates += [
        os.path.join(cache_dir, f)
        for f in os.listdir(cache_dir)
        if f.endswith(".json") and (f[:-5] == want or f[:-5].startswith(want + "-"))
    ]
    if not candidates:
        return None
    with open(candidates[0], encoding="utf-8") as fh:
        return _build(json.load(fh))


def load_latest(cache_dir: str = CACHE_DIR) -> WeatherData | None:
    """Return the most recently cached fetch, or ``None`` if the cache is empty."""
    if not os.path.isdir(cache_dir):
        return None
    files = [os.path.join(cache_dir, f) for f in os.listdir(cache_dir) if f.endswith(".json")]
    if not files:
        return None
    newest = max(files, key=os.path.getmtime)
    with open(newest, encoding="utf-8") as fh:
        return _build(json.load(fh))
