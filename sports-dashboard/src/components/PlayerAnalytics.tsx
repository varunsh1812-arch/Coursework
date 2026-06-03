import { useState } from 'react'
import { topPlayers } from '../data/playersData'
import { getTeam } from '../data/teamsData'
import PlayerRadarChart from './charts/PlayerRadarChart'
import ToggleButtonGroup from './ToggleButtonGroup'

export default function PlayerAnalytics() {
  const [selected, setSelected] = useState<string[]>(['haaland', 'palmer', 'salah'])
  const [sortKey, setSortKey] = useState<'goals' | 'assists' | 'rating' | 'xG'>('goals')

  const togglePlayer = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length > 1) setSelected(prev => prev.filter(p => p !== id))
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, id])
    }
  }

  const sortedPlayers = [...topPlayers].sort((a, b) =>
    b.stats[sortKey] - a.stats[sortKey]
  )

  const selectedPlayers = selected
    .map(id => topPlayers.find(p => p.id === id))
    .filter((p): p is (typeof topPlayers)[number] => Boolean(p))

  const statColor = (value: number, max: number) => {
    const pct = value / max
    if (pct > 0.75) return 'text-green-400'
    if (pct > 0.5) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const maxGoals = Math.max(...topPlayers.map(p => p.stats.goals))
  const maxAssists = Math.max(...topPlayers.map(p => p.stats.assists))
  const maxXG = Math.max(...topPlayers.map(p => p.stats.xG))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Player Selector */}
        <div className="xl:col-span-1 bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-1">Player Comparison</h3>
          <p className="text-xs text-gray-500 mb-4">Select up to 3 players to compare</p>
          <div className="space-y-2">
            {topPlayers.map(player => {
              const team = getTeam(player.team)
              const isSelected = selected.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-600/10'
                      : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: team?.color + '40', borderColor: team?.color, border: '1.5px solid' }}>
                    {team?.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{player.name}</div>
                    <div className="text-xs text-gray-500">{team?.shortName} · {player.position}</div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    <div className="text-green-400 font-semibold">{player.stats.goals}G</div>
                    <div className="text-blue-400">{player.stats.assists}A</div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="xl:col-span-2 bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-4">Attribute Comparison</h3>
          <div className="h-72">
            <PlayerRadarChart players={selectedPlayers} />
          </div>

          {/* Selected Player Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {selectedPlayers.map(player => {
              const team = getTeam(player.team)
              return (
                <div key={player.id} className="bg-dark-700 rounded-lg p-3 border border-dark-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{team?.logo}</span>
                    <div>
                      <div className="text-sm text-white font-medium leading-tight">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.position} · Age {player.age}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className={`text-base font-bold ${statColor(player.stats.goals, maxGoals)}`}>
                        {player.stats.goals}
                      </div>
                      <div className="text-xs text-gray-500">Goals</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${statColor(player.stats.assists, maxAssists)}`}>
                        {player.stats.assists}
                      </div>
                      <div className="text-xs text-gray-500">Assists</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-yellow-400">{player.stats.rating}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dark-600 flex justify-between text-xs">
                    <span className="text-gray-500">xG: <span className={statColor(player.stats.xG, maxXG)}>{player.stats.xG}</span></span>
                    <span className="text-gray-500">xA: <span className="text-purple-400">{player.stats.xA}</span></span>
                    <span className="text-gray-500">Mins: <span className="text-gray-300">{player.stats.minutesPlayed}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Scorers Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Top Performers</h3>
          <ToggleButtonGroup
            options={[
              { value: 'goals', label: 'GOALS' },
              { value: 'assists', label: 'ASSISTS' },
              { value: 'rating', label: 'Rating' },
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
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">Player</th>
                <th className="text-center py-2 px-3">Team</th>
                <th className="text-center py-2 px-3">Pos</th>
                <th className="text-center py-2 px-3">Apps</th>
                <th className="text-center py-2 px-3">Goals</th>
                <th className="text-center py-2 px-3">Assists</th>
                <th className="text-center py-2 px-3">xG</th>
                <th className="text-center py-2 px-3">xA</th>
                <th className="text-center py-2 px-3">Pass%</th>
                <th className="text-center py-2 px-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, i) => {
                const team = getTeam(player.team)
                return (
                  <tr key={player.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                    <td className="py-3 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-3 text-white font-medium">{player.name}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <span>{team?.logo}</span>
                        <span className="text-gray-400 text-xs">{team?.shortName}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs bg-dark-600 text-gray-300 px-2 py-0.5 rounded">
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">{player.stats.appearances}</td>
                    <td className={`py-3 px-3 text-center font-semibold ${statColor(player.stats.goals, maxGoals)}`}>
                      {player.stats.goals}
                    </td>
                    <td className={`py-3 px-3 text-center font-semibold ${statColor(player.stats.assists, maxAssists)}`}>
                      {player.stats.assists}
                    </td>
                    <td className="py-3 px-3 text-center text-purple-400">{player.stats.xG}</td>
                    <td className="py-3 px-3 text-center text-blue-400">{player.stats.xA}</td>
                    <td className="py-3 px-3 text-center text-gray-400">{player.stats.passAccuracy}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-yellow-400 font-bold">{player.stats.rating}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
