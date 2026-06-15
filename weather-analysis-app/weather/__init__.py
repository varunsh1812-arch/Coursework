"""Weather Analysis App.

A self-contained weather analysis toolkit that pulls live data from the
free, key-less Open-Meteo API, analyses it, and renders publication-quality
charts with matplotlib.

Modules
-------
geocoder    : turn a city name into latitude/longitude.
fetcher     : download live current/hourly/daily forecast + recent history.
analyzer    : compute descriptive statistics, trends and correlations.
visualizer  : render charts and a combined dashboard.
report      : write a human-readable Markdown summary.
sample_data : bundled snapshot used as an offline fallback.
"""

__version__ = "1.0.0"
__all__ = ["geocoder", "fetcher", "analyzer", "visualizer", "report", "sample_data"]
