#!/usr/bin/env python3
"""Weather Analysis App — command-line entry point.

Fetches live weather for a city, analyses it, renders charts and writes a
Markdown report. Works fully offline using a bundled data snapshot when no
network is available, so it runs on any laptop without setup headaches.

Examples
--------
    python weather_app.py --city "London"
    python weather_app.py --city "Tokyo" --past-days 14 --forecast-days 10
    python weather_app.py --offline            # use the bundled sample data
"""

from __future__ import annotations

import argparse
import json
import os
import sys

import requests

from weather import analyzer, fetcher, geocoder, report, sample_data, visualizer

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUTDIR = os.path.join(HERE, "outputs")


def _print_summary(analysis: analyzer.Analysis) -> None:
    s = analysis.summary
    print("\n" + "=" * 60)
    print(f"  WEATHER ANALYSIS — {s['location']}  ({s['source']} data)")
    print("=" * 60)
    print(f"  Now        : {s['current_conditions']}, "
          f"{s.get('current_temperature', 'n/a')}°C "
          f"(feels {s.get('current_apparent', 'n/a')}°C)")
    print(f"  Humidity   : {s.get('current_humidity', 'n/a')}%   "
          f"Wind: {s.get('current_wind', 'n/a')} km/h")
    print(f"  Mean temp  : {s.get('mean_temp', 'n/a')}°C "
          f"(range {s.get('min_temp', 'n/a')}–{s.get('max_temp', 'n/a')}°C)")
    print(f"  Total rain : {s.get('total_precipitation', 'n/a')} mm")
    print(f"  Temp trend : {analysis.temp_trend_per_day:+.2f} °C/day")
    print("=" * 60 + "\n")


def load_data(args: argparse.Namespace) -> fetcher.WeatherData:
    """Resolve the location and fetch live data, or fall back to the sample."""
    if args.offline:
        print("Offline mode requested — using bundled sample data.")
        return sample_data.load_sample()

    try:
        print(f"Looking up '{args.city}' ...")
        location = geocoder.geocode(args.city)
        print(f"  -> {location.label} ({location.latitude:.3f}, {location.longitude:.3f})")
        print("Fetching live weather from Open-Meteo ...")
        data = fetcher.fetch_weather(
            location, past_days=args.past_days, forecast_days=args.forecast_days
        )
        print("  -> live data received.")
        return data
    except (requests.RequestException, LookupError) as exc:
        print(f"  ! Could not fetch live data ({exc}).")
        print("  -> Falling back to bundled sample data.")
        return sample_data.load_sample()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Live weather analysis with charts.")
    parser.add_argument("--city", default="London", help="City name to analyse (default: London).")
    parser.add_argument("--past-days", type=int, default=7, help="Days of history (default: 7).")
    parser.add_argument("--forecast-days", type=int, default=7, help="Forecast days (default: 7).")
    parser.add_argument("--outdir", default=DEFAULT_OUTDIR, help="Output directory for charts.")
    parser.add_argument("--offline", action="store_true", help="Use bundled sample data only.")
    parser.add_argument("--save-json", metavar="PATH", help="Also dump raw tidy data to JSON.")
    args = parser.parse_args(argv)

    data = load_data(args)
    analysis = analyzer.analyze(data)
    _print_summary(analysis)

    print("Rendering charts ...")
    charts = visualizer.render_all(data, analysis, args.outdir)
    for c in charts:
        print(f"  -> {os.path.relpath(c, HERE)}")

    report_path = os.path.join(args.outdir, "report.md")
    report.write_report(data, analysis, charts, report_path)
    print(f"Report written: {os.path.relpath(report_path, HERE)}")

    if args.save_json:
        payload = {
            "summary": analysis.summary,
            "hourly": json.loads(data.hourly.reset_index().to_json(orient="records", date_format="iso")),
            "daily": json.loads(data.daily.reset_index().to_json(orient="records", date_format="iso")),
        }
        with open(args.save_json, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)
        print(f"Raw data written: {args.save_json}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
