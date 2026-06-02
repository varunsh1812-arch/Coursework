import type { Team, Prediction, PredictionFactor } from '../types'

// Elo-based win probability using logistic function
export function eloWinProbability(eloA: number, eloB: number, homeAdvantage = 65): number {
  const eloDiff = eloA + homeAdvantage - eloB
  return 1 / (1 + Math.pow(10, -eloDiff / 400))
}

// Poisson distribution PMF: P(X = k) = (λ^k * e^-λ) / k!
function poissonPMF(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let result = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) result *= lambda / i
  return result
}

// Predict exact score probabilities using Poisson model
export function poissonScoreProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 6
): { homeWin: number; draw: number; awayWin: number; probMatrix: number[][] } {
  const matrix: number[][] = []
  let homeWin = 0, draw = 0, awayWin = 0

  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = []
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poissonPMF(lambdaHome, h) * poissonPMF(lambdaAway, a)
      matrix[h][a] = prob
      if (h > a) homeWin += prob
      else if (h === a) draw += prob
      else awayWin += prob
    }
  }

  return { homeWin, draw, awayWin, probMatrix: matrix }
}

// Compute expected goals based on team stats
function computeExpectedGoals(attackTeam: Team, defenseTeam: Team, isHome: boolean): number {
  const homeBonus = isHome ? 0.25 : -0.1
  const attackStrength = attackTeam.stats.xG / (attackTeam.stats.played * 1.5)
  const defenseWeakness = defenseTeam.stats.xGA / (defenseTeam.stats.played * 1.2)
  const formMultiplier = computeFormMultiplier(attackTeam.stats.form)
  const leagueAvgGoals = 1.4

  return Math.max(0.1,
    leagueAvgGoals * attackStrength * defenseWeakness * formMultiplier + homeBonus
  )
}

function computeFormMultiplier(form: ('W' | 'D' | 'L')[]): number {
  const recentForm = form.slice(-5)
  const pts = recentForm.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
  return 0.8 + (pts / 15) * 0.4
}

// Main prediction function combining Elo + Poisson
export function predictMatch(homeTeam: Team, awayTeam: Team): Prediction {
  const lambdaHome = computeExpectedGoals(homeTeam, awayTeam, true)
  const lambdaAway = computeExpectedGoals(awayTeam, homeTeam, false)

  const poisson = poissonScoreProbabilities(lambdaHome, lambdaAway)
  const eloHome = eloWinProbability(homeTeam.eloRating, awayTeam.eloRating)
  // Derive draw/away from the Elo win prob. With large rating gaps these can go
  // negative, so clamp to >= 0 and renormalise into a valid distribution before blending.
  const rawEloDraw = Math.max(0, 0.28 - Math.abs(eloHome - 0.5) * 0.3)
  const rawEloAway = Math.max(0, 1 - eloHome - rawEloDraw)
  const eloSum = eloHome + rawEloDraw + rawEloAway
  const eloHomeNorm = eloHome / eloSum
  const eloDraw = rawEloDraw / eloSum
  const eloAway = rawEloAway / eloSum

  // Blend two valid distributions (Elo 60% / Poisson 40%) -> result stays valid & non-negative
  const homeWinProb = 0.6 * eloHomeNorm + 0.4 * poisson.homeWin
  const drawProb = 0.6 * eloDraw + 0.4 * poisson.draw
  const awayWinProb = 0.6 * eloAway + 0.4 * poisson.awayWin

  // Normalize to sum = 1
  const total = homeWinProb + drawProb + awayWinProb
  const normalizedHome = homeWinProb / total
  const normalizedDraw = drawProb / total
  const normalizedAway = awayWinProb / total

  const eloDiff = homeTeam.eloRating - awayTeam.eloRating
  const confidence = Math.min(0.95, 0.5 + Math.abs(normalizedHome - normalizedAway) * 0.8)

  const factors: PredictionFactor[] = [
    {
      name: 'Elo Rating Difference',
      impact: eloDiff / 400,
      description: `${homeTeam.shortName} Elo: ${homeTeam.eloRating} vs ${awayTeam.shortName}: ${awayTeam.eloRating}`
    },
    {
      name: 'Recent Form',
      impact: computeFormMultiplier(homeTeam.stats.form) - computeFormMultiplier(awayTeam.stats.form),
      description: `${homeTeam.shortName}: ${homeTeam.stats.form.join('')} | ${awayTeam.shortName}: ${awayTeam.stats.form.join('')}`
    },
    {
      name: 'xG Advantage',
      impact: (homeTeam.stats.xG - homeTeam.stats.xGA - (awayTeam.stats.xG - awayTeam.stats.xGA)) / 50,
      description: `Net xG: ${homeTeam.shortName} ${(homeTeam.stats.xG - homeTeam.stats.xGA).toFixed(1)} vs ${awayTeam.shortName} ${(awayTeam.stats.xG - awayTeam.stats.xGA).toFixed(1)}`
    },
    {
      name: 'Home Advantage',
      impact: 0.15,
      description: `+15% baseline home advantage`
    },
    {
      name: 'Clean Sheet Rate',
      impact: (homeTeam.stats.cleanSheets - awayTeam.stats.cleanSheets) / homeTeam.stats.played,
      description: `${homeTeam.shortName}: ${homeTeam.stats.cleanSheets} CS | ${awayTeam.shortName}: ${awayTeam.stats.cleanSheets} CS`
    }
  ]

  return {
    homeTeam: homeTeam.id,
    awayTeam: awayTeam.id,
    homeWinProb: parseFloat(normalizedHome.toFixed(4)),
    drawProb: parseFloat(normalizedDraw.toFixed(4)),
    awayWinProb: parseFloat(normalizedAway.toFixed(4)),
    predictedHomeGoals: parseFloat(lambdaHome.toFixed(2)),
    predictedAwayGoals: parseFloat(lambdaAway.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(4)),
    factors
  }
}

// Live win probability that updates as game progresses
export function liveProbability(
  baseHomeProb: number,
  homeGoals: number,
  awayGoals: number,
  minute: number
): { home: number; draw: number; away: number } {
  const timeRemaining = Math.max(0, 90 - minute)
  const goalDiff = homeGoals - awayGoals

  // Adjust based on current score and time remaining
  const scoreFactor = goalDiff * (1 - timeRemaining / 90) * 2
  const adjustedHome = Math.max(0.02, Math.min(0.96, baseHomeProb + scoreFactor * 0.2))

  // Draw probability decreases with time unless tied
  const drawBase = goalDiff === 0 ? 0.4 - (minute / 90) * 0.15 : 0.05 * (timeRemaining / 90)
  const awayAdj = Math.max(0.02, 1 - adjustedHome - drawBase)

  const total = adjustedHome + drawBase + awayAdj
  return {
    home: adjustedHome / total,
    draw: drawBase / total,
    away: awayAdj / total
  }
}

// Model accuracy simulation (backtesting result)
export const modelAccuracyStats = {
  totalPredictions: 342,
  correctOutcome: 234,
  accuracy: 0.684,
  logLoss: 0.921,
  brierScore: 0.198,
  roi: 12.4,
  byLeague: {
    'Premier League': { accuracy: 0.698, n: 180 },
    'La Liga': { accuracy: 0.671, n: 162 }
  }
}
