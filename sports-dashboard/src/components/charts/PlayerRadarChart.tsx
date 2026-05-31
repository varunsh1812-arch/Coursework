import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import type { Player } from '../../types'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  players: Player[]
}

const COLORS = [
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' }
]

function normalize(value: number, max: number) {
  return Math.min(100, (value / max) * 100)
}

export default function PlayerRadarChart({ players }: Props) {
  const labels = ['Goals', 'Assists', 'Shot Acc.', 'Dribbles', 'Defending', 'Pass Acc.']

  const datasets = players.slice(0, 3).map((player, i) => {
    const s = player.stats
    const data = [
      normalize(s.goals, 30),
      normalize(s.assists, 15),
      normalize(s.shotsOnTarget / s.appearances, 3),
      normalize(s.dribbles, 100),
      normalize((s.tackles + s.interceptions) / s.appearances, 2),
      normalize(s.passAccuracy, 100)
    ]
    return {
      label: player.name.split(' ').pop()!,
      data,
      borderColor: COLORS[i].border,
      backgroundColor: COLORS[i].bg,
      borderWidth: 2,
      pointBackgroundColor: COLORS[i].border,
      pointRadius: 4
    }
  })

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 12 }, boxWidth: 16 }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx: import('chart.js').TooltipItem<'radar'>) =>
            ` ${ctx.dataset.label ?? ''}: ${(ctx.raw as number).toFixed(1)}`
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: '#334155' },
        angleLines: { color: '#334155' },
        pointLabels: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  }

  return <Radar data={{ labels, datasets }} options={options} />
}
