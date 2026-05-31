import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { premierLeagueTeams } from '../../data/teamsData'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type StatKey = 'goals' | 'xG' | 'possession' | 'shots' | 'cleanSheets'

interface Props {
  stat: StatKey
}

const STAT_CONFIG: Record<StatKey, {
  label: string
  getter: (t: typeof premierLeagueTeams[0]) => number
  color: string
}> = {
  goals: { label: 'Goals Scored', getter: t => t.stats.goalsFor, color: '#3b82f6' },
  xG: { label: 'Expected Goals (xG)', getter: t => t.stats.xG, color: '#8b5cf6' },
  possession: { label: 'Avg Possession %', getter: t => t.stats.avgPossession, color: '#10b981' },
  shots: { label: 'Avg Shots per Game', getter: t => t.stats.avgShots, color: '#f59e0b' },
  cleanSheets: { label: 'Clean Sheets', getter: t => t.stats.cleanSheets, color: '#06b6d4' }
}

export default function StatBarChart({ stat }: Props) {
  const config = STAT_CONFIG[stat]
  const sorted = [...premierLeagueTeams].sort((a, b) => config.getter(b) - config.getter(a))

  const data = {
    labels: sorted.map(t => t.shortName),
    datasets: [{
      label: config.label,
      data: sorted.map(t => config.getter(t)),
      backgroundColor: sorted.map((_, i) =>
        i === 0 ? config.color : config.color + '80'
      ),
      borderColor: config.color,
      borderWidth: 1,
      borderRadius: 4
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' }
      }
    }
  }

  return <Bar data={data} options={options} />
}
