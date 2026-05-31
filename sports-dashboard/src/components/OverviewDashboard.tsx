import { premierLeagueTeams } from '../data/teamsData'
import { topPlayers } from '../data/playersData'
import { recentMatches } from '../data/matchesData'
import { modelAccuracyStats } from '../models/predictionEngine'
import type { Match } from '../types'

interface Props {
  liveMatches: Match[]
  onTabChange: (tab: string) => void
}

export default function OverviewDashboard({ liveMatches, onTabChange }: Props) {
  const leader = premierLeagueTeams[0]
  const topScorer = topPlayers.reduce((a, b) => b.stats.goals > a.stats.goals ? b : a)

  const kpis = [
    { label: 'Live Matches', value: liveMatches.filter(m => m.status === 'LIVE').length, color: 'text-red-400', icon: '🔴', sub: 'in progress' },
    { label: 'League Leader', value: leader.name, color: 'text-blue-400', icon: leader.logo, sub: `${leader.stats.points} pts` },
    { label: 'Top Scorer', value: topScorer.name.split(' ').pop()!, color: 'text-yellow-400', icon: '⚽', sub: `${topScorer.stats.goals} goals` },
    { label: 'Model Accuracy', value: `${(modelAccuracyStats.accuracy * 100).toFixed(1)}%`, color: 'text-green-400', icon: '🤖', sub: `${modelAccuracyStats.totalPredictions} games` }
  ]

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-dark-800 rounded-xl border border-dark-600 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <div className={`text-xl font-bold ${kpi.color} truncate`}>{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Links */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Live Matches', icon: '📡', tab: 'live', color: 'border-red-500/30 hover:border-red-500/60' },
              { label: 'Predictions', icon: '🤖', tab: 'predictions', color: 'border-blue-500/30 hover:border-blue-500/60' },
              { label: 'Team Stats', icon: '📊', tab: 'teams', color: 'border-purple-500/30 hover:border-purple-500/60' },
              { label: 'Players', icon: '⚽', tab: 'players', color: 'border-green-500/30 hover:border-green-500/60' }
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className={`flex flex-col items-center gap-2 p-4 bg-dark-700 rounded-lg border ${item.color} transition-colors`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-gray-300 font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-4">Recent Results</h3>
          <div className="space-y-2">
            {recentMatches.filter(m => m.status === 'FT').slice(0, 4).map(match => {
              const home = premierLeagueTeams.find(t => t.id === match.homeTeam)
              const away = premierLeagueTeams.find(t => t.id === match.awayTeam)
              return (
                <div key={match.id} className="flex items-center gap-2 p-2.5 bg-dark-700 rounded-lg">
                  <span className="text-sm">{home?.logo}</span>
                  <span className="text-xs text-gray-300 flex-1">{home?.shortName}</span>
                  <span className="text-sm font-bold text-white bg-dark-600 px-2 py-0.5 rounded font-mono">
                    {match.homeScore} – {match.awayScore}
                  </span>
                  <span className="text-xs text-gray-300 flex-1 text-right">{away?.shortName}</span>
                  <span className="text-sm">{away?.logo}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Scorers Snapshot */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-4">Golden Boot Race</h3>
          <div className="space-y-3">
            {topPlayers
              .sort((a, b) => b.stats.goals - a.stats.goals)
              .slice(0, 5)
              .map((player, i) => {
                const team = premierLeagueTeams.find(t => t.id === player.team)
                const maxGoals = topPlayers[0].stats.goals
                return (
                  <div key={player.id} className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    <span className="text-sm">{team?.logo}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-white">{player.name}</span>
                        <span className="text-xs font-bold text-yellow-400">{player.stats.goals}</span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${(player.stats.goals / maxGoals) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Live Match Snapshot */}
      {liveMatches.some(m => m.status === 'LIVE') && (
        <div className="bg-dark-800 rounded-xl border border-red-500/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-fast" />
            <h3 className="text-white font-semibold">Live Now</h3>
            <button onClick={() => onTabChange('live')} className="ml-auto text-xs text-primary-400 hover:text-primary-300">
              View full →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveMatches.filter(m => m.status === 'LIVE').map(match => {
              const home = premierLeagueTeams.find(t => t.id === match.homeTeam)
              const away = premierLeagueTeams.find(t => t.id === match.awayTeam)
              return (
                <div key={match.id} className="bg-dark-700 rounded-lg p-4 border border-dark-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{home?.logo}</span>
                    <span className="text-sm text-white font-medium">{home?.shortName}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{match.homeScore} – {match.awayScore}</div>
                    <div className="text-xs text-red-400">{match.minute}'</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{away?.shortName}</span>
                    <span className="text-xl">{away?.logo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
