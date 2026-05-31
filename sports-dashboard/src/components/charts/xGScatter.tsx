import {
  Chart as ChartJS, LinearScale, PointElement,
  Tooltip, Legend
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { premierLeagueTeams } from '../../data/teamsData'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

export default function XGScatter() {
  const data = {
    datasets: [{
      label: 'Teams',
      data: premierLeagueTeams.map(t => ({
        x: parseFloat((t.stats.xG / t.stats.played).toFixed(2)),
        y: parseFloat((t.stats.xGA / t.stats.played).toFixed(2)),
        label: t.shortName
      })),
      backgroundColor: premierLeagueTeams.map(t => t.color + 'cc'),
      borderColor: premierLeagueTeams.map(t => t.color),
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 12
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
        borderWidth: 1,
        callbacks: {
          label: (ctx: import('chart.js').TooltipItem<'scatter'>) => {
            const raw = ctx.raw as { x: number; y: number; label: string }
            return ` ${raw.label}: xG ${raw.x} | xGA ${raw.y}`
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'xG per Game (Attack)', color: '#64748b' },
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' }
      },
      y: {
        title: { display: true, text: 'xGA per Game (Defence)', color: '#64748b' },
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#1e293b' },
        reverse: true
      }
    }
  }

  return (
    <div>
      <div className="h-64">
        <Scatter data={data} options={options} />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Top-right = strong attack. Top-left = elite (strong attack + strong defence).
      </p>
    </div>
  )
}
