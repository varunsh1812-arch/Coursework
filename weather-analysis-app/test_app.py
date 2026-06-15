"""Offline smoke tests for the weather analysis pipeline.

Run with:  python test_app.py
These use the bundled sample snapshot, so they pass with no internet.
"""

from __future__ import annotations

import os
import tempfile

from weather import analyzer, report, sample_data, visualizer


def test_sample_loads():
    data = sample_data.load_sample()
    assert not data.hourly.empty, "hourly frame should not be empty"
    assert not data.daily.empty, "daily frame should not be empty"
    assert "temperature_2m" in data.hourly.columns
    print("PASS: sample data loads with hourly + daily series")


def test_analysis():
    data = sample_data.load_sample()
    a = analyzer.analyze(data)
    assert a.summary["min_temp"] <= a.summary["mean_temp"] <= a.summary["max_temp"]
    assert not a.correlations.empty
    # Self-correlation must be 1.0 on the diagonal.
    assert abs(a.correlations.loc["temperature_2m", "temperature_2m"] - 1.0) < 1e-6
    print("PASS: analysis produces consistent statistics & correlations")


def test_charts_and_report():
    data = sample_data.load_sample()
    a = analyzer.analyze(data)
    with tempfile.TemporaryDirectory() as tmp:
        charts = visualizer.render_all(data, a, tmp)
        assert len(charts) == 5
        for c in charts:
            assert os.path.getsize(c) > 1000, f"{c} looks too small"
        rpt = report.write_report(data, a, charts, os.path.join(tmp, "report.md"))
        assert os.path.getsize(rpt) > 200
    print("PASS: 5 charts rendered and report written")


if __name__ == "__main__":
    test_sample_loads()
    test_analysis()
    test_charts_and_report()
    print("\nAll tests passed.")
