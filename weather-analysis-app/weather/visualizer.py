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
    return produced
