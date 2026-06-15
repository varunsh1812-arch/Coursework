# 🌦️ Weather Analysis App

A self-contained Python application that pulls **live weather data**, analyses
it, and produces **publication-quality graphs** and a **Markdown report**.

It is built to *just work on any laptop*:

- **No API key, no sign-up.** Uses the free [Open-Meteo](https://open-meteo.com) API.
- **Three ways to run it:** command line, a **desktop GUI** (Tkinter), and a
  **Jupyter notebook** walkthrough.
- **Works offline.** Ships with a real data snapshot *and* caches every live
  fetch, so it still produces full output with no internet (`--offline`).
- **Headless-safe.** Uses matplotlib's `Agg` backend — no display server needed.
- **Pure-Python dependencies** that install in seconds with `pip`.

It also pulls **air quality** (PM2.5 / PM10 / US AQI), draws a **wind rose** and
**daylight hours**, and can **compare several cities** on one chart.

---

## 📸 Screenshots

### Overview dashboard
A single-page summary of current conditions plus every key chart.

![Dashboard](screenshots/dashboard.png)

### Hourly temperature (actual vs. "feels like")
![Temperature](screenshots/temperature.png)

### 7-day temperature & precipitation
![Daily forecast](screenshots/daily_forecast.png)

### Humidity & wind
![Humidity and wind](screenshots/humidity_wind.png)

### Temperature distribution
![Temperature distribution](screenshots/temp_distribution.png)

### Wind rose (direction & speed)
![Wind rose](screenshots/wind_rose.png)

### Air quality (PM2.5 / PM10 / US AQI)
![Air quality](screenshots/air_quality.png)

### Hours of daylight
![Daylight](screenshots/daylight.png)

### City comparison
![City comparison](screenshots/comparison.png)

A full example report is in [`screenshots/report.md`](screenshots/report.md), and a
fully-executed notebook walkthrough is in
[`weather_analysis_demo.ipynb`](weather_analysis_demo.ipynb).

---

## 🚀 Quick start

```bash
# 1. Install dependencies (takes a few seconds)
pip install -r requirements.txt

# 2. Analyse any city with live data
python weather_app.py --city "Tokyo"

# 3. Compare several cities
python weather_app.py --compare "London,Tokyo,Mumbai"

# 4. No internet? Use cached/bundled data
python weather_app.py --offline

# 5. Or launch the desktop GUI
python weather_gui.py
```

Charts and a `report.md` are written to the `outputs/` folder.

### Desktop GUI

`python weather_gui.py` opens a window with a city box, an *Offline* toggle and a
tab per chart. Tkinter ships with Python on Windows and macOS; on Linux install
it once with `sudo apt-get install python3-tk`.

### Jupyter notebook

`weather_analysis_demo.ipynb` is a step-by-step walkthrough with charts rendered
inline. Open it in Jupyter/VS Code/Colab, or regenerate it with
`python build_notebook.py`.

### Command-line options

| Option             | Default    | Description                                  |
|--------------------|------------|----------------------------------------------|
| `--city`           | `London`   | City name to analyse.                        |
| `--past-days`      | `7`        | Days of recent history to include.           |
| `--forecast-days`  | `7`        | Days of forecast to include.                 |
| `--outdir`         | `outputs/` | Where to save charts and the report.         |
| `--offline`        | off        | Use cached/bundled data instead of the API.  |
| `--compare CITIES` | —          | Comma-separated cities to compare on one chart. |
| `--save-json PATH` | —          | Also dump the tidy data to a JSON file.      |

Examples:

```bash
python weather_app.py --city "New York" --past-days 14 --forecast-days 10
python weather_app.py --city "Mumbai" --save-json outputs/mumbai.json
```

---

## 📊 What it computes

- **Current conditions** — temperature, "feels like", humidity, wind, sky state
  (decoded from WMO weather codes).
- **Period summary** — mean / min / max temperature, warmest & coldest hours,
  mean humidity, total precipitation.
- **Temperature trend** — least-squares slope in °C per day (warming/cooling).
- **Correlations** — between temperature, humidity, precipitation and wind.
- **Daily statistics** — describe() table for min/max temp and precipitation.
- **Daylight** — mean hours of daylight and the longest day.
- **Air quality** — peak US AQI with its EPA category and mean PM2.5.

## 📈 What it draws

1. **Dashboard** — everything on one page.
2. **Hourly temperature** — actual vs. apparent, with the gap shaded.
3. **Daily forecast** — min/max band + precipitation bars (dual axis).
4. **Humidity & wind** — stacked time series.
5. **Temperature distribution** — histogram with the mean marked.
6. **Wind rose** — frequency by direction, stacked by speed band.
7. **Daylight** — hours of daylight per day.
8. **Air quality** — PM2.5 / PM10 with US AQI and EPA bands.
9. **Comparison** — overlay multiple cities (`--compare`).

---

## 🗂️ Project structure

```
weather-analysis-app/
├── weather_app.py             # CLI entry point
├── weather_gui.py             # Tkinter desktop GUI
├── build_notebook.py          # regenerates the demo notebook
├── weather_analysis_demo.ipynb# executed walkthrough with inline charts
├── weather/
│   ├── geocoder.py            # city name  -> latitude/longitude
│   ├── fetcher.py             # live weather + air quality -> tidy frames
│   ├── analyzer.py            # statistics, trends, correlations, WMO/AQI codes
│   ├── visualizer.py          # matplotlib charts, wind rose, dashboard, compare
│   ├── report.py              # Markdown report writer
│   ├── cache.py               # on-disk cache of live fetches (offline reuse)
│   ├── sample_data.py         # offline fallback loader
│   └── sample_payload.json    # bundled real data snapshot
├── test_app.py                # offline smoke tests
├── requirements.txt
├── outputs/                   # generated at runtime
├── cache/                     # cached live fetches (auto-created)
└── screenshots/               # committed example output
```

## 🧪 Tests

```bash
python test_app.py
```

Runs entirely offline and verifies that data loads, statistics are consistent,
and all five charts plus the report are produced.

---

## ⚙️ How it works

1. `geocoder` resolves a city name to coordinates (Open-Meteo geocoding).
2. `fetcher` requests current + hourly + daily data (with recent history) and
   tidies it into pandas DataFrames indexed by time.
3. `analyzer` derives summary statistics, a linear temperature trend, and a
   correlation matrix.
4. `visualizer` renders five charts; `report` writes a linked Markdown summary.
5. If the network is unavailable, the app transparently falls back to the
   bundled snapshot so it never fails to produce output.

Data source: [Open-Meteo](https://open-meteo.com/) — free for non-commercial use.

## Author

**Varun Sharma** — BS in Data Science & Artificial Intelligence
