import { useLiveFeed } from '../hooks/useLiveFeed'
import { predictMatch, liveProbability } from '../models/predictionEngine'
import { premierLeagueTeams } from '../data/teamsData'
import WinProbGauge from './charts/WinProbGauge'

export default function LiveFeedPanel() {
  const { liveMatches, latestEvents, refresh } = useLiveFeed()

  const getTeam = (id: string) => premierLeagueTeams.find(t => t.id === id)

  const eventIcon = (type: string) => {
    if (type === 'goal') return '⚽'
    if (type === 'yellow_card') return '🟨'
    if (type === 'red_card') return '🟥'
    if (type === 'substitution') return '🔄'
    return '📋'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-fast" />
          <span className="text-white font-semibold">Live Matches</span>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-xs text-gray-300 transition-colors"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {liveMatches.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-10 text-center">
          <div className="text-4xl mb-3">⏰</div>
          <div className="text-gray-400">No live matches right now</div>
          <div className="text-gray-500 text-sm mt-1">Check back during match days</div>
        </div>
      ) : (
        liveMatches.map(match => {
          const home = getTeam(match.homeTeam)
          const away = getTeam(match.awayTeam)
          if (!home || !away) return null

          const basePred = predictMatch(home, away)
          const liveProbs = liveProbability(
            basePred.homeWinProb,
            match.homeScore,
            match.awayScore,
            match.minute || 60
          )

          return (
            <div key={match.id} className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
              {/* Match Header */}
              <div className="bg-dark-700 px-5 py-3 flex items-center justify-between border-b border-dark-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-fast" />
                  <span className="text-xs text-red-400 font-semibold">LIVE</span>
                  <span className="text-xs text-gray-500">Min {match.minute}'</span>
                </div>
                <span className="text-xs text-gray-500">{match.league}</span>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: home.color + '30' }}>
                        {home.logo}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{home.name}</div>
                        <div className="text-xs text-gray-500">Home</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">
                        {match.homeScore} – {match.awayScore}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        xG: {match.homeXG?.toFixed(1)} – {match.awayXG?.toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-white font-semibold">{away.name}</div>
                        <div className="text-xs text-gray-500">Away</div>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: away.color + '30' }}>
                        {away.logo}
                      </div>
                    </div>
                  </div>

                  {/* Possession Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Possession {match.homePossession}%</span>
                      <span>{100 - (match.homePossession || 50)}%</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 transition-all" style={{ width: `${match.homePossession}%` }} />
                      <div className="bg-red-500 flex-1" />
                    </div>
                  </div>

                  {/* Match Events */}
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-2">Match Events</div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(match.events || []).slice().reverse().map((event, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 w-8 text-xs font-mono">{event.minute}'</span>
                          <span>{eventIcon(event.type)}</span>
                          <span className="text-gray-300">{event.player}</span>
                          <span className={`text-xs ${event.team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>
                            ({event.team === 'home' ? home.shortName : away.shortName})
                          </span>
                          {event.detail && <span className="text-xs text-gray-500">{event.detail}</span>}
                        </div>
                      ))}
                      {(!match.events || match.events.length === 0) && (
                        <p className="text-xs text-gray-600">No events recorded yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Win Probability */}
                <div>
                  <div className="text-sm text-gray-400 font-medium mb-3">Live Win Probability</div>
                  <WinProbGauge
                    homeProb={liveProbs.home}
                    drawProb={liveProbs.draw}
                    awayProb={liveProbs.away}
                    homeLabel={home.shortName}
                    awayLabel={away.shortName}
                    liveMode
                  />
                  <div className="mt-4 p-3 bg-dark-700 rounded-lg border border-dark-600">
                    <div className="text-xs text-gray-400 font-medium mb-2">Pre-Match Prediction</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Predicted:</span>
                      <span className="text-white font-mono">
                        {basePred.predictedHomeGoals.toFixed(1)} – {basePred.predictedAwayGoals.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">Base Probs:</span>
                      <span className="text-gray-300 font-mono">
                        {Math.round(basePred.homeWinProb * 100)}/{Math.round(basePred.drawProb * 100)}/{Math.round(basePred.awayWinProb * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Event Feed */}
      {latestEvents.length > 0 && (
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-5">
          <h3 className="text-white font-semibold mb-3">Live Event Feed</h3>
          <div className="space-y-2">
            {latestEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 bg-dark-700 rounded-lg border border-dark-600 animate-fade-in"
              >
                <div className="text-xl">
                  {event.type === 'goal' ? '⚽' : event.type === 'yellow_card' ? '🟨' : '🔔'}
                </div>
                <div>
                  <div className="text-sm text-white">{event.player}</div>
                  <div className="text-xs text-gray-500">
                    Min {event.minute}' · {event.homeTeam.toUpperCase()} vs {event.awayTeam.toUpperCase()}
                  </div>
                </div>
                {event.type === 'goal' && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">GOAL!</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
