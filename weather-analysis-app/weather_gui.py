#!/usr/bin/env python3
"""Weather Analysis App — desktop GUI (Tkinter).

A clickable window: type a city, press Analyse, and browse every chart in
tabs. Tkinter ships with CPython on Windows and macOS; on Linux install it
with ``sudo apt install python3-tk``.

Run:  python weather_gui.py
"""

from __future__ import annotations

import os
import sys
import tempfile
import threading

try:
    import tkinter as tk
    from tkinter import messagebox, ttk
except ImportError:  # pragma: no cover - environment without Tk
    sys.stderr.write(
        "Tkinter is not available. On Linux install it with:\n"
        "    sudo apt-get install python3-tk\n"
        "On Windows/macOS it ships with the standard Python installer.\n"
        "You can still use the command-line app: python weather_app.py --help\n"
    )
    sys.exit(1)

import requests

from weather import analyzer, cache, fetcher, geocoder, sample_data, visualizer

HERE = os.path.dirname(os.path.abspath(__file__))

CHART_TABS = [
    ("dashboard.png", "Dashboard"),
    ("temperature.png", "Temperature"),
    ("daily_forecast.png", "Forecast"),
    ("humidity_wind.png", "Humidity & Wind"),
    ("temp_distribution.png", "Distribution"),
    ("wind_rose.png", "Wind Rose"),
    ("daylight.png", "Daylight"),
    ("air_quality.png", "Air Quality"),
]


class WeatherGUI(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Weather Analysis App")
        self.geometry("1180x820")
        self.minsize(900, 600)
        self._tmpdir = tempfile.mkdtemp(prefix="weather_gui_")
        self._images: dict[str, tk.PhotoImage] = {}  # keep refs alive
        self._build_widgets()

    # --- UI construction -------------------------------------------------
    def _build_widgets(self) -> None:
        top = ttk.Frame(self, padding=10)
        top.pack(fill="x")

        ttk.Label(top, text="City:").pack(side="left")
        self.city_var = tk.StringVar(value="London")
        entry = ttk.Entry(top, textvariable=self.city_var, width=28)
        entry.pack(side="left", padx=6)
        entry.bind("<Return>", lambda _e: self.analyse())

        self.offline_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Offline", variable=self.offline_var).pack(side="left", padx=6)

        self.analyse_btn = ttk.Button(top, text="Analyse", command=self.analyse)
        self.analyse_btn.pack(side="left", padx=6)

        self.summary_var = tk.StringVar(value="Enter a city and press Analyse.")
        ttk.Label(self, textvariable=self.summary_var, padding=(12, 4),
                  font=("TkDefaultFont", 10)).pack(fill="x")

        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=8, pady=8)
        self._tab_canvases: dict[str, tk.Canvas] = {}
        for filename, label in CHART_TABS:
            frame = ttk.Frame(self.notebook)
            self.notebook.add(frame, text=label)
            canvas = tk.Canvas(frame, background="white")
            vbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
            hbar = ttk.Scrollbar(frame, orient="horizontal", command=canvas.xview)
            canvas.configure(yscrollcommand=vbar.set, xscrollcommand=hbar.set)
            vbar.pack(side="right", fill="y")
            hbar.pack(side="bottom", fill="x")
            canvas.pack(side="left", fill="both", expand=True)
            self._tab_canvases[filename] = canvas

        self.status_var = tk.StringVar(value="Ready.")
        ttk.Label(self, textvariable=self.status_var, relief="sunken",
                  anchor="w", padding=4).pack(fill="x", side="bottom")

    # --- Actions ---------------------------------------------------------
    def analyse(self) -> None:
        """Kick off a background fetch so the UI stays responsive."""
        self.analyse_btn.config(state="disabled")
        self.status_var.set("Fetching data ...")
        threading.Thread(target=self._worker, daemon=True).start()

    def _worker(self) -> None:
        city = self.city_var.get().strip() or "London"
        offline = self.offline_var.get()
        try:
            data = self._load(city, offline)
            analysis = analyzer.analyze(data)
            charts = visualizer.render_all(data, analysis, self._tmpdir)
            chart_names = {os.path.basename(c) for c in charts}
            # Update the UI back on the main thread.
            self.after(0, lambda: self._on_ready(data, analysis, chart_names))
        except Exception as exc:  # noqa: BLE001 - surface any failure to the user
            self.after(0, lambda: self._on_error(exc))

    def _load(self, city: str, offline: bool) -> fetcher.WeatherData:
        if offline:
            return (cache.load_city(city) or cache.load_latest()
                    or sample_data.load_sample())
        try:
            location = geocoder.geocode(city)
            data = fetcher.fetch_weather(location)
            cache.save(data)
            return data
        except (requests.RequestException, LookupError):
            return (cache.load_city(city) or cache.load_latest()
                    or sample_data.load_sample())

    def _on_ready(self, data, analysis, chart_names: set[str]) -> None:
        s = analysis.summary
        self.summary_var.set(
            f"{s['location']}  ({s['source']})   "
            f"{s['current_conditions']}, {s.get('current_temperature', '?')}°C   "
            f"mean {s.get('mean_temp', '?')}°C, range {s.get('min_temp', '?')}–"
            f"{s.get('max_temp', '?')}°C   "
            f"AQI {s.get('max_us_aqi', 'n/a')} ({s.get('aqi_category', 'n/a')})"
        )
        for filename, canvas in self._tab_canvases.items():
            canvas.delete("all")
            path = os.path.join(self._tmpdir, filename)
            if filename in chart_names and os.path.exists(path):
                img = tk.PhotoImage(file=path)
                self._images[filename] = img  # prevent garbage collection
                canvas.create_image(0, 0, anchor="nw", image=img)
                canvas.config(scrollregion=(0, 0, img.width(), img.height()))
            else:
                canvas.create_text(20, 20, anchor="nw",
                                    text="(no data for this chart)", fill="grey")
        self.status_var.set(f"Done — {s['location']} ({s['source']} data).")
        self.analyse_btn.config(state="normal")

    def _on_error(self, exc: Exception) -> None:
        self.status_var.set("Error.")
        self.analyse_btn.config(state="normal")
        messagebox.showerror("Weather Analysis App", f"Could not complete analysis:\n{exc}")


def main() -> int:
    WeatherGUI().mainloop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
