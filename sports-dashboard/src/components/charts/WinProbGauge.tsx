import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip)

interface Props {
  homeProb: number
  drawProb: number
  awayProb: number
  homeLabel: string
  awayLabel: string
  liveMode?: boolean
}

export default function WinProbGauge({ homeProb, drawProb, awayProb, homeLabel, awayLabel, liveMode }: Props) {
  const data = {
    labels: [homeLabel, 'Draw', awayLabel],
    datasets: [{
      data: [
        Math.round(homeProb * 100),
        Math.round(drawProb * 100),
        Math.round(awayProb * 100)
      ],
      backgroundColor: ['#3b82f6', '#64748b', '#ef4444'],
      borderColor: ['#2563eb', '#475569', '#dc2626'],
      borderWidth: 2,
      hoverOffset: 8
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx: import('chart.js').TooltipItem<'doughnut'>) => ` ${ctx.label}: ${ctx.raw as number}%`
        }
      }
    }
  }

  const maxIdx = [homeProb, drawProb, awayProb].indexOf(Math.max(homeProb, drawProb, awayProb))
  const maxLabel = [homeLabel, 'Draw', awayLabel][maxIdx]
  const maxProb = Math.round(Math.max(homeProb, drawProb, awayProb) * 100)

  return (
    <div className="relative">
      <div className="h-48">
        <Doughnut data={data} options={options} />
      </div>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {liveMode && <div className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-fast" />LIVE
        </div>}
        <div className="text-2xl font-bold text-white">{maxProb}%</div>
        <div className="text-xs text-gray-400">{maxLabel}</div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3">
        {[
          { label: homeLabel, prob: homeProb, color: 'bg-blue-500' },
          { label: 'Draw', prob: drawProb, color: 'bg-slate-500' },
          { label: awayLabel, prob: awayProb, color: 'bg-red-500' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-400">{item.label}</span>
            <span className="text-xs font-semibold text-white">{Math.round(item.prob * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
