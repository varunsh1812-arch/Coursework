import { useState } from 'react'
import PerformanceChart from './charts/PerformanceChart'
import StatBarChart from './charts/StatBarChart'
import XGScatter from './charts/xGScatter'
import ToggleButtonGroup from './ToggleButtonGroup'
import { premierLeagueTeams } from '../data/teamsData'

type MetricKey = 'cumulativePoints' | 'xG' | 'goalsScored'
type StatKey = 'goals' | 'xG' | 'possession' | 'shots' | 'cleanSheets'

export default function TeamAnalytics() {
  const [metric, setMetric] = useState<MetricKey>('cumulativePoints')
  const [stat, setStat] = useState<StatKey>('goals')
  const [sortKey, setSortKey] = useState<'points' | 'goalsFor' | 'goalsAgainst' | 'xG'>('points')

  const sorted = [...premierLeagueTeams].sort((a, b) => {
    if (sortKey === 'xG') return b.stats.xG - a.stats.xG
    return b.stats[sortKey] - a.stats[sortKey]
  })

  const formColor = (r: 'W' | 'D' | 'L') =>
    r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-4">
      {/* Season Timeline */}
      <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-white font-semibold">Season Timeline – Top 4 Teams</h3>
          <ToggleButtonGroup
            size="lg"
            options={[
              { value: 'cumulativePoints', label: 'Points' },
              { value: 'xG', label: 'xG' },
              { value: 'goalsScored', label: 'Goals' }
            ]}
            value={metric}
            onChange={v => setMetric(v as MetricKey)}
          />
        </div>
        <div className="h-64">
          <PerformanceChart metric={metric} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-white font-semibold">Team Statistics</h3>
            <ToggleButtonGroup
              options={[
                { value: 'goals', label: 'GOALS' },
                { value: 'xG', label: 'XG' },
                { value: 'possession', label: 'Poss' },
                { value: 'shots', label: 'SHOTS' },
                { value: 'cleanSheets', label: 'CS' }
              ]}
              value={stat}
              onChange={v => setStat(v as StatKey)}
            />
          </div>
          <div className="h-52">
            <StatBarChart stat={stat} />
          </div>
        </div>

        {/* xG Scatter */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-4">xG Profile (Attack vs Defence)</h3>
          <XGScatter />
        </div>
      </div>

      {/* League Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Premier League Table</h3>
          <ToggleButtonGroup
            options={[
              { value: 'points', label: 'POINTS' },
              { value: 'goalsFor', label: 'GF' },
              { value: 'goalsAgainst', label: 'GA' },
              { value: 'xG', label: 'XG' }
            ]}
            value={sortKey}
            onChange={v => setSortKey(v as typeof sortKey)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-dark-600">
                <th className="text-left py-2 px-2 w-6">#</th>
                <th className="text-left py-2 px-2">Club</th>
                <th className="text-center py-2 px-2">P</th>
                <th className="text-center py-2 px-2">W</th>
                <th className="text-center py-2 px-2">D</th>
                <th className="text-center py-2 px-2">L</th>
                <th className="text-center py-2 px-2">GF</th>
                <th className="text-center py-2 px-2">GA</th>
                <th className="text-center py-2 px-2">GD</th>
                <th className="text-center py-2 px-2">xG</th>
                <th className="text-center py-2 px-2">Form</th>
                <th className="text-center py-2 px-2 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, i) => (
                <tr key={team.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                  <td className="py-3 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span>{team.logo}</span>
                      <span className="text-white font-medium">{team.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 text-gray-400">{team.stats.played}</td>
                  <td className="text-center py-3 px-2 text-green-400">{team.stats.wins}</td>
                  <td className="text-center py-3 px-2 text-yellow-400">{team.stats.draws}</td>
                  <td className="text-center py-3 px-2 text-red-400">{team.stats.losses}</td>
                  <td className="text-center py-3 px-2 text-gray-300">{team.stats.goalsFor}</td>
                  <td className="text-center py-3 px-2 text-gray-300">{team.stats.goalsAgainst}</td>
                  <td className={`text-center py-3 px-2 font-medium ${
                    team.stats.goalsFor - team.stats.goalsAgainst > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {team.stats.goalsFor - team.stats.goalsAgainst > 0 ? '+' : ''}
                    {team.stats.goalsFor - team.stats.goalsAgainst}
                  </td>
                  <td className="text-center py-3 px-2 text-purple-400">{team.stats.xG.toFixed(1)}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-0.5 justify-center">
                      {team.stats.form.map((r, j) => (
                        <div key={j} className={`w-4 h-4 rounded-sm ${formColor(r)} flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold leading-none">{r}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-bold text-white">{team.stats.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
