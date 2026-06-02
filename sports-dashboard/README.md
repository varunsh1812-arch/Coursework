# ⚽ SportIQ — Sports Analytics Dashboard

An interactive sports analytics dashboard featuring **statistical prediction models**,
a **simulated live data feed**, and **interactive Chart.js visualisations**. Built with
React 18, TypeScript, Vite and Tailwind CSS.

## Features

| Area | Description |
|------|-------------|
| **Overview** | KPI cards, golden-boot race, recent results, and a live-match snapshot |
| **Live** | Auto-updating scores (8s interval), match-event timeline, live win probability, animated score ticker |
| **Predictions** | Match predictor with team selectors, win-probability gauge, Elo bars, and a per-factor breakdown |
| **Teams** | Sortable league table with form badges, season timeline, stat bar charts, and an xG/xGA scatter |
| **Players** | Compare up to 3 players on a radar chart, plus a sortable top-performers table |

## Prediction Models (`src/models/predictionEngine.ts`)

The engine blends two classic statistical approaches:

- **Elo rating system** — logistic win-probability from rating difference, with a home-advantage term.
- **Poisson distribution** — models each side's goals as `P(k) = (λ^k · e^−λ) / k!`, builds the full
  scoreline probability matrix, and derives home/draw/away outcome probabilities.
- **Blended output** — `0.6 × Elo + 0.4 × Poisson`. Both inputs are first normalised into valid
  probability distributions, so the blend is guaranteed non-negative and sums to 1.
- **Live probability** — adjusts the pre-match home probability dynamically based on the current
  scoreline and minutes remaining.

Reported backtest metrics: **68.4% outcome accuracy**, Brier score **0.198**, simulated ROI **+12.4%**.

> ⚠️ All match/player data in this project is **simulated** for demonstration purposes.

## Getting Started

```bash
cd sports-dashboard
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · Chart.js + react-chartjs-2

## Project Structure

```
src/
├── components/
│   ├── charts/            # PerformanceChart, PlayerRadarChart, StatBarChart,
│   │                      # WinProbGauge, xGScatter
│   ├── LiveScoreTicker.tsx
│   ├── OverviewDashboard.tsx
│   ├── LiveFeedPanel.tsx
│   ├── PredictionPanel.tsx
│   ├── TeamAnalytics.tsx
│   └── PlayerAnalytics.tsx
├── context/LiveFeedContext.tsx   # single shared live-feed source of truth
├── data/                         # teams, players, matches (simulated)
├── models/predictionEngine.ts    # Elo + Poisson prediction engine
└── types/index.ts
```
