"""Write a human-readable Markdown report from an Analysis."""

from __future__ import annotations

import os
from datetime import datetime

from .analyzer import Analysis
from .fetcher import WeatherData


def _safe(value, suffix: str = "") -> str:
    return f"{value}{suffix}" if value is not None else "n/a"


def _frame_to_md(frame) -> str:
    """Render a DataFrame as a Markdown table, falling back to a code block.

    ``DataFrame.to_markdown`` needs the optional ``tabulate`` package; if it is
    not installed we degrade gracefully to a fixed-width text block so the
    report still generates on a minimal environment.
    """
    try:
        return frame.to_markdown()
    except ImportError:
        return "```\n" + frame.to_string() + "\n```"


def write_report(data: WeatherData, analysis: Analysis, charts: list[str], path: str) -> str:
    """Render a Markdown report summarising the analysis and link the charts."""
    s = analysis.summary
    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    chart_names = {os.path.splitext(os.path.basename(c))[0]: os.path.basename(c) for c in charts}

    lines = [
        f"# Weather Analysis Report — {s['location']}",
        "",
        f"*Generated {generated} from **{s['source']}** data "
        f"(lat {s['latitude']:.3f}, lon {s['longitude']:.3f}).*",
        "",
        "## Current conditions",
        "",
        f"- **Conditions:** {s['current_conditions']}",
        f"- **Temperature:** {_safe(s.get('current_temperature'), '°C')} "
        f"(feels like {_safe(s.get('current_apparent'), '°C')})",
        f"- **Humidity:** {_safe(s.get('current_humidity'), '%')}",
        f"- **Wind:** {_safe(s.get('current_wind'), ' km/h')}",
        "",
        "## Period summary",
        "",
        f"- **Mean temperature:** {_safe(s.get('mean_temp'), '°C')}",
        f"- **Range:** {_safe(s.get('min_temp'), '°C')} to {_safe(s.get('max_temp'), '°C')}",
        f"- **Warmest hour:** {_safe(s.get('warmest_hour'))}",
        f"- **Coldest hour:** {_safe(s.get('coldest_hour'))}",
        f"- **Mean humidity:** {_safe(s.get('mean_humidity'), '%')}",
        f"- **Total precipitation:** {_safe(s.get('total_precipitation'), ' mm')}",
        f"- **Temperature trend:** {analysis.temp_trend_per_day:+.2f} °C/day "
        f"({'warming' if analysis.temp_trend_per_day >= 0 else 'cooling'})",
    ]
    if "mean_daylight_hours" in s:
        lines.append(f"- **Mean daylight:** {s['mean_daylight_hours']} h "
                     f"(longest day {s.get('longest_day', 'n/a')})")
    if "max_us_aqi" in s:
        lines.append(f"- **Air quality:** peak US AQI {s['max_us_aqi']:.0f} "
                     f"({s.get('aqi_category', 'n/a')}), "
                     f"mean PM2.5 {s.get('mean_pm2_5', 'n/a')} µg/m³")
    lines.append("")

    if not analysis.correlations.empty:
        lines += ["## Correlations (hourly)", "", _frame_to_md(analysis.correlations), ""]

    if not analysis.daily_stats.empty:
        cols = [c for c in ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"]
                if c in analysis.daily_stats.columns]
        if cols:
            lines += ["## Daily statistics", "", _frame_to_md(analysis.daily_stats[cols]), ""]

    lines += ["## Charts", ""]
    titles = {
        "dashboard": "Overview dashboard",
        "temperature": "Hourly temperature (actual vs. feels-like)",
        "daily_forecast": "7-day temperature & precipitation",
        "humidity_wind": "Humidity & wind",
        "temp_distribution": "Temperature distribution",
        "wind_rose": "Wind rose (direction & speed)",
        "daylight": "Hours of daylight",
        "air_quality": "Air quality (PM2.5 / PM10 / US AQI)",
    }
    for key, title in titles.items():
        if key in chart_names:
            lines.append(f"### {title}")
            lines.append(f"![{title}]({chart_names[key]})")
            lines.append("")

    content = "\n".join(lines)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    return path
