import { useState, useMemo } from 'react'
import { predictMatch, modelAccuracyStats } from '../models/predictionEngine'
import { premierLeagueTeams, getTeam } from '../data/teamsData'
import { upcomingMatches } from '../data/matchesData'
import WinProbGauge from './charts/WinProbGauge'

export default function PredictionPanel() {
  const [homeId, setHomeId] = useState('mci')
  const [awayId, setAwayId] = useState('ars')

  // Changing the home team to whatever is currently selected away would leave both selects
  // pointing at the same club (a nonsensical self-vs-self prediction and an uncontrolled away
  // select). Bump the away team to a different club whenever that collision would happen.
  const handleHomeChange = (id: string) => {
    setHomeId(id)
    if (id === awayId) {
      const alt = premierLeagueTeams.find(t => t.id !== id)
      if (alt) setAwayId(alt.id)
    }
  }

  const homeTeam = getTeam(homeId)!
  const awayTeam = getTeam(awayId)!
  const prediction = useMemo(() => predictMatch(homeTeam, awayTeam), [homeTeam, awayTeam])
  // Static fixtures — compute once rather than on every dropdown change / re-render.
  const upcomingPredictions = useMemo(
    () => upcomingMatches.slice(0, 3).map(match => ({
      match,
      hTeam: getTeam(match.homeTeam)!,
      aTeam: getTeam(match.awayTeam)!,
      pred: predictMatch(getTeam(match.homeTeam)!, getTeam(match.awayTeam)!)
    })),
    []
  )

  const impactColor = (impact: number) =>
    impact > 0.05 ? 'text-green-400' : impact < -0.05 ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Prediction Config */}
      <div className="xl:col-span-1 bg-dark-800 rounded-xl border border-dark-600 p-5">
        <h3 className="text-white font-semibold mb-4">Match Predictor</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Home Team</label>
            <select
              value={homeId}
              onChange={e => handleHomeChange(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {premierLeagueTeams.map(t => (
                <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
              ))}
            </select>
          </div>
          <div className="text-center text-gray-500 text-sm font-medium">vs</div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Away Team</label>
            <select
              value={awayId}
              onChange={e => setAwayId(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {premierLeagueTeams.filter(t => t.id !== homeId).map(t => (
                <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Score Prediction */}
        <div className="mt-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
          <div className="text-xs text-gray-400 mb-2 text-center">Predicted Score</div>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {prediction.predictedHomeGoals.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">{homeTeam.shortName}</div>
            </div>
            <div className="text-gray-600 text-lg">–</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {prediction.predictedAwayGoals.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">{awayTeam.shortName}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex-1 bg-dark-600 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-full rounded-full transition-all"
                style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {Math.round(prediction.confidence * 100)}% confidence
            </span>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="mt-4 p-4 bg-dark-700 rounded-lg border border-dark-600">
          <div className="text-xs text-gray-400 mb-3 font-medium">Model Performance</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">
                {(modelAccuracyStats.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                +{modelAccuracyStats.roi}%
              </div>
              <div className="text-xs text-gray-500">Backtested ROI</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-300">
                {modelAccuracyStats.brierScore}
              </div>
              <div className="text-xs text-gray-500">Brier Score</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-300">
                {modelAccuracyStats.totalPredictions}
              </div>
              <div className="text-xs text-gray-500">Predictions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Probability Gauge */}
      <div className="xl:col-span-1 bg-dark-800 rounded-xl border border-dark-600 p-5">
        <h3 className="text-white font-semibold mb-4">Win Probability</h3>
        <WinProbGauge
          homeProb={prediction.homeWinProb}
          drawProb={prediction.drawProb}
          awayProb={prediction.awayWinProb}
          homeLabel={homeTeam.shortName}
          awayLabel={awayTeam.shortName}
        />

        {/* Elo Ratings */}
        <div className="mt-6 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Elo Ratings</div>
          {[homeTeam, awayTeam].map(team => (
            <div key={team.id} className="flex items-center gap-3">
              <span className="text-sm text-gray-300 w-8">{team.logo}</span>
              <span className="text-sm text-white w-28">{team.shortName}</span>
              <div className="flex-1 bg-dark-600 rounded-full h-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((team.eloRating - 1600) / 600) * 100}%`,
                    backgroundColor: team.color
                  }}
                />
              </div>
              <span className="text-sm font-mono text-gray-300 w-12 text-right">
                {team.eloRating}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction Factors */}
      <div className="xl:col-span-1 bg-dark-800 rounded-xl border border-dark-600 p-5">
        <h3 className="text-white font-semibold mb-4">Key Factors</h3>
        <div className="space-y-3">
          {prediction.factors.map((factor, i) => (
            <div key={i} className="bg-dark-700 rounded-lg p-3 border border-dark-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white font-medium">{factor.name}</span>
                <span className={`text-sm font-bold ${impactColor(factor.impact)}`}>
                  {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{factor.description}</p>
              <div className="mt-1.5 h-1 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${factor.impact >= 0 ? 'bg-blue-500' : 'bg-red-500'} transition-all`}
                  style={{ width: `${Math.min(100, Math.abs(factor.impact) * 200)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Fixtures */}
        <div className="mt-6">
          <div className="text-xs text-gray-400 font-medium mb-3">Upcoming Predictions</div>
          <div className="space-y-2">
            {upcomingPredictions.map(({ match, hTeam, aTeam, pred }) => {
              return (
                <div key={match.id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-300 flex-1">{hTeam.shortName} vs {aTeam.shortName}</span>
                  <span className="text-blue-400 font-semibold">{Math.round(pred.homeWinProb * 100)}%</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-400">{Math.round(pred.drawProb * 100)}%</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-red-400 font-semibold">{Math.round(pred.awayWinProb * 100)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
