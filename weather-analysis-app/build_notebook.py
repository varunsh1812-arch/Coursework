"""Generate the demonstration notebook (weather_analysis_demo.ipynb).

Run once to (re)create the notebook; it is then executed with nbconvert so the
charts are embedded as outputs. Kept in the repo so the notebook is
reproducible rather than hand-edited.
"""

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []


def md(text):
    cells.append(nbf.v4.new_markdown_cell(text))


def code(text):
    cells.append(nbf.v4.new_code_cell(text))


md(
    "# 🌦️ Weather Analysis — Interactive Walkthrough\n"
    "\n"
    "This notebook demonstrates the **Weather Analysis App**: it pulls **live** "
    "weather from the free, key-less [Open-Meteo](https://open-meteo.com) API, "
    "analyses it, and draws charts inline.\n"
    "\n"
    "If there is no internet connection it automatically falls back to a bundled "
    "data snapshot, so the notebook always runs end-to-end."
)

md("## 1. Setup\nImport the project modules.")
code(
    "import os\n"
    "import requests\n"
    "from IPython.display import Image, display\n"
    "\n"
    "from weather import analyzer, fetcher, geocoder, sample_data, visualizer\n"
    "print('Modules loaded.')"
)

md(
    "## 2. Fetch live data\n"
    "We resolve a city name to coordinates, then download current, hourly and "
    "daily data (with a week of recent history) plus air quality. On any failure "
    "we fall back to the offline sample."
)
code(
    "CITY = 'London'\n"
    "try:\n"
    "    location = geocoder.geocode(CITY)\n"
    "    data = fetcher.fetch_weather(location)\n"
    "    print(f'Live data for {location.label}')\n"
    "except (requests.RequestException, LookupError) as exc:\n"
    "    print(f'Live fetch failed ({exc}); using bundled sample.')\n"
    "    data = sample_data.load_sample()\n"
    "\n"
    "print('Source:', data.source)\n"
    "data.hourly.head()"
)

md("## 3. Current conditions & analysis\nCompute summary statistics, a temperature trend and correlations.")
code(
    "analysis = analyzer.analyze(data)\n"
    "summary = analysis.summary\n"
    "for key in ['location', 'current_conditions', 'current_temperature', 'mean_temp',\n"
    "            'min_temp', 'max_temp', 'total_precipitation', 'mean_daylight_hours',\n"
    "            'max_us_aqi', 'aqi_category']:\n"
    "    if key in summary:\n"
    "        print(f'{key:22}: {summary[key]}')\n"
    "print(f'\\nTemperature trend     : {analysis.temp_trend_per_day:+.2f} °C/day')"
)

md("### Correlations between weather variables")
code("analysis.correlations")

md("### Daily statistics")
code(
    "cols = [c for c in ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']\n"
    "        if c in analysis.daily_stats.columns]\n"
    "analysis.daily_stats[cols]"
)

md(
    "## 4. Charts\n"
    "Render every chart and display it inline. (The app also saves these as PNGs "
    "and writes a Markdown report.)"
)
code(
    "outdir = 'outputs'\n"
    "charts = visualizer.render_all(data, analysis, outdir)\n"
    "for path in charts:\n"
    "    display(Image(filename=path))"
)

md(
    "## 5. Compare several cities\n"
    "Overlay hourly temperature for a few cities and compare their mean / range."
)
code(
    "cities = ['London', 'Tokyo', 'Mumbai']\n"
    "datasets = []\n"
    "for c in cities:\n"
    "    try:\n"
    "        datasets.append(fetcher.fetch_weather(geocoder.geocode(c)))\n"
    "    except (requests.RequestException, LookupError):\n"
    "        pass\n"
    "if len(datasets) < 2:\n"
    "    datasets = [sample_data.load_sample()]\n"
    "\n"
    "if len(datasets) >= 2:\n"
    "    path = visualizer.plot_comparison(datasets, os.path.join('outputs', 'comparison.png'))\n"
    "    for d in datasets:\n"
    "        t = d.hourly['temperature_2m']\n"
    "        print(f\"{d.location.label:<28} mean {t.mean():5.1f}°C  range {t.min():.1f}-{t.max():.1f}°C\")\n"
    "    display(Image(filename=path))\n"
    "else:\n"
    "    print('Need at least two cities online to compare; skipped offline.')"
)

md(
    "## 6. Conclusion\n"
    "From a single city name we fetched live data, derived statistics and trends, "
    "and produced a full set of visualisations — all reproducibly and offline-capable.\n"
    "\n"
    "Run the command-line version with `python weather_app.py --city \"Paris\"` or the "
    "desktop GUI with `python weather_gui.py`."
)

nb["cells"] = cells
nb["metadata"] = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python"},
}

with open("weather_analysis_demo.ipynb", "w", encoding="utf-8") as fh:
    nbf.write(nb, fh)
print("Wrote weather_analysis_demo.ipynb with", len(cells), "cells.")
