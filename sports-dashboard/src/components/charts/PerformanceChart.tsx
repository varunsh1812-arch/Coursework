import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { seasonProgressData } from '../../data/matchesData'
import { getTeam } from '../../data/teamsData'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  metric: 'cumulativePoints' | 'xG' | 'goalsScored'
}

export default function PerformanceChart({ metric }: Props) {
  const teams = ['mci', 'ars', 'liv', 'avl']
  const labels = Array.from({ length: 36 }, (_, i) => `GW${i + 1}`)

  const datasets = teams.map(teamId => {
    const team = getTeam(teamId)!
    const teamData = seasonProgressData
      .filter(d => d.teamId === teamId)
      .sort((a, b) => a.week - b.week)
      .map(d => d[metric])

    return {
      label: team.shortName,
      data: teamData,
      borderColor: team.color,
      backgroundColor: team.color + '20',
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.4,
      fill: false
    }
  })

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 12 }, boxWidth: 20 }
      },
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
        ticks: {
          color: '#64748b',
          maxTicksLimit: 9,
          font: { size: 10 }
        },
        grid: { color: '#1e293b' }
      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' },
        title: {
          display: true,
          text: metric === 'cumulativePoints' ? 'Points' : metric === 'xG' ? 'xG per Game' : 'Goals',
          color: '#64748b'
        }
      }
    }
  }

  return <Line data={{ labels, datasets }} options={options} />
}
