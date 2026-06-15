"""Render weather charts and a combined dashboard with matplotlib.

All figures are saved to PNG files so the app produces durable outputs that
can be viewed on any machine without a display server (the Agg backend is
used, so it works headless on any laptop or CI runner).
"""

from __future__ import annotations

import os

import matplotlib

matplotlib.use("Agg")  # headless-safe; no display required.

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .analyzer import Analysis, describe_weather_code
from .fetcher import WeatherData

plt.rcParams.update(
    {
        "figure.facecolor": "white",
        "axes.grid": True,
        "grid.alpha": 0.3,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "font.size": 10,
    }
)

ACCENT = "#e4572e"
COOL = "#2e86ab"
GREEN = "#3a7d44"


def _time_axis(ax) -> None:
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d\n%H:%M"))
    ax.tick_params(axis="x", labelsize=8)


def plot_temperature(data: WeatherData, path: str) -> str:
    """Hourly actual vs. apparent ('feels like') temperature."""
    hourly = data.hourly
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(hourly.index, hourly["temperature_2m"], color=ACCENT, lw=2, label="Temperature")
    if "apparent_temperature" in hourly:
        ax.plot(
            hourly.index,
            hourly["apparent_temperature"],
            color=COOL,
            lw=1.5,
            ls="--",
            label="Feels like",
        )
        ax.fill_between(
            hourly.index,
            hourly["temperature_2m"],
            hourly["apparent_temperature"],
            color="grey",
            alpha=0.12,
        )
    unit = data.units.get("temperature_2m", "°C")
    ax.set_title(f"Hourly Temperature — {data.location.label}", fontweight="bold")
    ax.set_ylabel(f"Temperature ({unit})")
    ax.legend(loc="upper right")
    _time_axis(ax)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_daily_forecast(data: WeatherData, path: str) -> str:
    """Daily min/max temperature band with precipitation bars on a second axis."""
    daily = data.daily
    fig, ax = plt.subplots(figsize=(11, 5))
    days = daily.index

    ax.plot(days, daily["temperature_2m_max"], "o-", color=ACCENT, label="Max temp")
    ax.plot(days, daily["temperature_2m_min"], "o-", color=COOL, label="Min temp")
    ax.fill_between(
        days, daily["temperature_2m_min"], daily["temperature_2m_max"], color=ACCENT, alpha=0.1
    )
    unit = data.units.get("temperature_2m_max", "°C")
    ax.set_ylabel(f"Temperature ({unit})")
    ax.set_title(f"7-Day Temperature & Precipitation — {data.location.label}", fontweight="bold")

    if "precipitation_sum" in daily:
        ax2 = ax.twinx()
        ax2.bar(days, daily["precipitation_sum"], width=0.5, color=GREEN, alpha=0.45, label="Precip")
        ax2.set_ylabel(f"Precipitation ({data.units.get('precipitation_sum', 'mm')})")
        ax2.grid(False)
        ax2.set_ylim(bottom=0)

    ax.xaxis.set_major_formatter(mdates.DateFormatter("%a\n%b %d"))
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_humidity_wind(data: WeatherData, path: str) -> str:
    """Humidity and wind speed over time, stacked."""
    hourly = data.hourly
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 6), sharex=True)

    ax1.plot(hourly.index, hourly["relative_humidity_2m"], color=COOL, lw=1.6)
    ax1.fill_between(hourly.index, hourly["relative_humidity_2m"], color=COOL, alpha=0.15)
    ax1.set_ylabel("Humidity (%)")
    ax1.set_title(f"Humidity & Wind — {data.location.label}", fontweight="bold")
    ax1.set_ylim(0, 100)

    ax2.plot(hourly.index, hourly["wind_speed_10m"], color=GREEN, lw=1.6)
    ax2.fill_between(hourly.index, hourly["wind_speed_10m"], color=GREEN, alpha=0.15)
    ax2.set_ylabel(f"Wind ({data.units.get('wind_speed_10m', 'km/h')})")
    _time_axis(ax2)

    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_temperature_distribution(data: WeatherData, path: str) -> str:
    """Histogram of hourly temperatures with the mean marked."""
    temps = data.hourly["temperature_2m"].dropna()
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(temps, bins=18, color=ACCENT, alpha=0.8, edgecolor="white")
    ax.axvline(temps.mean(), color=COOL, ls="--", lw=2, label=f"Mean {temps.mean():.1f}°")
    ax.set_xlabel(f"Temperature ({data.units.get('temperature_2m', '°C')})")
    ax.set_ylabel("Hours")
    ax.set_title(f"Temperature Distribution — {data.location.label}", fontweight="bold")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_wind_rose(data: WeatherData, path: str) -> str | None:
    """Polar wind rose: frequency of wind by direction, coloured by speed band."""
    hourly = data.hourly
    if "wind_direction_10m" not in hourly or "wind_speed_10m" not in hourly:
        return None

    df = hourly[["wind_direction_10m", "wind_speed_10m"]].dropna()
    if df.empty:
        return None

    n_sectors = 16
    sector = 360.0 / n_sectors
    # Bin directions into sectors centred on N, NNE, ...
    dir_bins = (((df["wind_direction_10m"] + sector / 2) % 360) // sector).astype(int)

    speed_edges = [0, 5, 10, 20, 30, np.inf]
    speed_labels = ["0–5", "5–10", "10–20", "20–30", "30+"]
    speed_bins = pd.cut(df["wind_speed_10m"], bins=speed_edges, labels=speed_labels, right=False)

    table = pd.crosstab(dir_bins, speed_bins)
    table = table.reindex(range(n_sectors), fill_value=0)

    theta = np.deg2rad(np.arange(n_sectors) * sector)
    width = np.deg2rad(sector) * 0.9
    colors = plt.cm.viridis(np.linspace(0.15, 0.95, len(speed_labels)))

    fig = plt.figure(figsize=(7.5, 7.5))
    ax = fig.add_subplot(111, projection="polar")
    ax.set_theta_zero_location("N")
    ax.set_theta_direction(-1)

    bottom = np.zeros(n_sectors)
    for label, color in zip(speed_labels, colors):
        if label not in table.columns:
            continue
        vals = table[label].to_numpy(dtype=float)
        ax.bar(theta, vals, width=width, bottom=bottom, color=color, edgecolor="white",
               linewidth=0.4, label=f"{label} km/h")
        bottom += vals

    ax.set_xticks(np.deg2rad(np.arange(0, 360, 45)))
    ax.set_xticklabels(["N", "NE", "E", "SE", "S", "SW", "W", "NW"])
    ax.set_title(f"Wind Rose — {data.location.label}", fontweight="bold", pad=20)
    ax.legend(loc="upper right", bbox_to_anchor=(1.18, 1.1), fontsize=8, title="Speed")
    fig.tight_layout()
    fig.savefig(path, dpi=130, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_daylight(data: WeatherData, path: str) -> str | None:
    """Daily hours of daylight, derived from sunrise/sunset."""
    daily = data.daily
    if not {"sunrise", "sunset"}.issubset(daily.columns):
        return None
    sunrise = pd.to_datetime(daily["sunrise"])
    sunset = pd.to_datetime(daily["sunset"])
    hours = (sunset - sunrise).dt.total_seconds() / 3600.0

    fig, ax = plt.subplots(figsize=(10, 4.5))
    bars = ax.bar(daily.index, hours, width=0.55, color="#f4a259", edgecolor="white")
    for rect, h in zip(bars, hours):
        ax.text(rect.get_x() + rect.get_width() / 2, h + 0.05, f"{h:.1f}h",
                ha="center", va="bottom", fontsize=8)
    ax.set_ylabel("Daylight (hours)")
    ax.set_title(f"Hours of Daylight — {data.location.label}", fontweight="bold")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%a\n%b %d"))
    ax.set_ylim(0, max(hours) + 1.5)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_air_quality(data: WeatherData, path: str) -> str | None:
    """Particulate matter (PM2.5/PM10) with the US AQI on a second axis."""
    aq = data.air_quality
    if aq.empty or "pm2_5" not in aq:
        return None

    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(aq.index, aq["pm2_5"], color=ACCENT, lw=1.8, label="PM2.5")
    if "pm10" in aq:
        ax.plot(aq.index, aq["pm10"], color="#8a5a44", lw=1.4, label="PM10")
    ax.set_ylabel("Concentration (µg/m³)")
    ax.set_title(f"Air Quality — {data.location.label}", fontweight="bold")

    if "us_aqi" in aq:
        ax2 = ax.twinx()
        ax2.plot(aq.index, aq["us_aqi"], color=COOL, lw=1.4, ls="--", label="US AQI")
        ax2.set_ylabel("US AQI")
        ax2.grid(False)
        # Shade the EPA "Good" (<=50) and "Moderate" (<=100) bands faintly.
        ax2.axhspan(0, 50, color="green", alpha=0.05)
        ax2.axhspan(50, 100, color="gold", alpha=0.05)

    lines1, labels1 = ax.get_legend_handles_labels()
    handles, labels = lines1, labels1
    if "us_aqi" in aq:
        lines2, labels2 = ax2.get_legend_handles_labels()
        handles, labels = lines1 + lines2, labels1 + labels2
    ax.legend(handles, labels, loc="upper right")
    _time_axis(ax)
    fig.tight_layout()
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def plot_comparison(datasets: list[WeatherData], path: str) -> str:
    """Overlay hourly temperature and compare daily max across several cities."""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 9), gridspec_kw={"hspace": 0.3})
    colors = plt.cm.tab10(np.linspace(0, 1, max(len(datasets), 1)))

    for data, color in zip(datasets, colors):
        h = data.hourly
        if "temperature_2m" in h:
            ax1.plot(h.index, h["temperature_2m"], lw=1.6, color=color, label=data.location.label)

    ax1.set_title("Hourly Temperature Comparison", fontweight="bold")
    ax1.set_ylabel("Temperature (°C)")
    ax1.legend(loc="upper right", fontsize=8)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

    # Grouped bars of mean temperature per city.
    labels = [d.location.label for d in datasets]
    means = [float(d.hourly["temperature_2m"].mean()) if "temperature_2m" in d.hourly else 0.0
             for d in datasets]
    mins = [float(d.hourly["temperature_2m"].min()) if "temperature_2m" in d.hourly else 0.0
            for d in datasets]
    maxs = [float(d.hourly["temperature_2m"].max()) if "temperature_2m" in d.hourly else 0.0
            for d in datasets]
    x = np.arange(len(labels))
    ax2.bar(x, means, color=colors[: len(labels)], alpha=0.85)
    ax2.errorbar(x, means,
                 yerr=[np.subtract(means, mins), np.subtract(maxs, means)],
                 fmt="none", ecolor="grey", capsize=5)
    for xi, m in zip(x, means):
        ax2.text(xi, m + 0.2, f"{m:.1f}°", ha="center", fontsize=9)
    ax2.set_xticks(x)
    ax2.set_xticklabels(labels, rotation=15, ha="right")
    ax2.set_ylabel("Temperature (°C)")
    ax2.set_title("Mean Temperature (bars) with Min–Max Range (whiskers)", fontweight="bold")

    fig.savefig(path, dpi=130, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_dashboard(data: WeatherData, analysis: Analysis, path: str) -> str:
    """A single-page overview combining current conditions and key charts."""
    fig = plt.figure(figsize=(14, 9))
    gs = fig.add_gridspec(3, 2, hspace=0.45, wspace=0.22)
    hourly = data.hourly
    daily = data.daily

    fig.suptitle(
        f"Weather Dashboard — {data.location.label}   ({data.source} data)",
        fontsize=16,
        fontweight="bold",
    )

    # Current-conditions text panel.
    ax_now = fig.add_subplot(gs[0, 0])
    ax_now.axis("off")
    cur = data.current
    lines = [
        f"Conditions : {describe_weather_code(cur.get('weather_code'))}",
        f"Temperature: {cur.get('temperature_2m', 'n/a')} {data.units.get('temperature_2m', '°C')}",
        f"Feels like : {cur.get('apparent_temperature', 'n/a')} {data.units.get('temperature_2m', '°C')}",
        f"Humidity   : {cur.get('relative_humidity_2m', 'n/a')} %",
        f"Wind       : {cur.get('wind_speed_10m', 'n/a')} {data.units.get('wind_speed_10m', 'km/h')}",
        f"Mean temp  : {analysis.summary.get('mean_temp', 'n/a')}°  (range {analysis.summary.get('min_temp', 'n/a')}–{analysis.summary.get('max_temp', 'n/a')}°)",
        f"Total rain : {analysis.summary.get('total_precipitation', 'n/a')} mm",
        f"Temp trend : {analysis.temp_trend_per_day:+.2f}°/day",
    ]
    ax_now.text(
        0.0,
        0.95,
        "CURRENT CONDITIONS",
        fontsize=12,
        fontweight="bold",
        va="top",
        color=ACCENT,
    )
    ax_now.text(0.0, 0.78, "\n".join(lines), fontsize=11, va="top", family="monospace")

    # Temperature line.
    ax_t = fig.add_subplot(gs[0, 1])
    ax_t.plot(hourly.index, hourly["temperature_2m"], color=ACCENT, lw=1.8)
    if "apparent_temperature" in hourly:
        ax_t.plot(hourly.index, hourly["apparent_temperature"], color=COOL, lw=1, ls="--")
    ax_t.set_title("Hourly temperature")
    ax_t.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

    # Daily forecast.
    ax_d = fig.add_subplot(gs[1, :])
    ax_d.plot(daily.index, daily["temperature_2m_max"], "o-", color=ACCENT, label="Max")
    ax_d.plot(daily.index, daily["temperature_2m_min"], "o-", color=COOL, label="Min")
    ax_d.fill_between(
        daily.index, daily["temperature_2m_min"], daily["temperature_2m_max"], color=ACCENT, alpha=0.1
    )
    if "precipitation_sum" in daily:
        ax_d2 = ax_d.twinx()
        ax_d2.bar(daily.index, daily["precipitation_sum"], width=0.5, color=GREEN, alpha=0.4)
        ax_d2.set_ylabel("Precip (mm)")
        ax_d2.grid(False)
    ax_d.set_title("Daily min/max temperature & precipitation")
    ax_d.legend(loc="upper left")
    ax_d.xaxis.set_major_formatter(mdates.DateFormatter("%a %d"))

    # Humidity.
    ax_h = fig.add_subplot(gs[2, 0])
    ax_h.plot(hourly.index, hourly["relative_humidity_2m"], color=COOL)
    ax_h.fill_between(hourly.index, hourly["relative_humidity_2m"], color=COOL, alpha=0.15)
    ax_h.set_title("Humidity (%)")
    ax_h.set_ylim(0, 100)
    ax_h.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

    # Wind.
    ax_w = fig.add_subplot(gs[2, 1])
    ax_w.plot(hourly.index, hourly["wind_speed_10m"], color=GREEN)
    ax_w.fill_between(hourly.index, hourly["wind_speed_10m"], color=GREEN, alpha=0.15)
    ax_w.set_title("Wind speed")
    ax_w.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

    fig.savefig(path, dpi=130, bbox_inches="tight")
    plt.close(fig)
    return path


def render_all(data: WeatherData, analysis: Analysis, outdir: str) -> list[str]:
    """Render every chart into *outdir* and return the list of file paths."""
    os.makedirs(outdir, exist_ok=True)
    produced = [
        plot_dashboard(data, analysis, os.path.join(outdir, "dashboard.png")),
        plot_temperature(data, os.path.join(outdir, "temperature.png")),
        plot_daily_forecast(data, os.path.join(outdir, "daily_forecast.png")),
        plot_humidity_wind(data, os.path.join(outdir, "humidity_wind.png")),
        plot_temperature_distribution(data, os.path.join(outdir, "temp_distribution.png")),
    ]
    # Optional charts — only produced when the underlying data is present.
    optional = [
        plot_wind_rose(data, os.path.join(outdir, "wind_rose.png")),
        plot_daylight(data, os.path.join(outdir, "daylight.png")),
        plot_air_quality(data, os.path.join(outdir, "air_quality.png")),
    ]
    produced.extend(p for p in optional if p is not None)
    return produced
