export interface Team {
  id: string
  name: string
  shortName: string
  logo: string
  color: string
  league: string
  stats: TeamStats
  eloRating: number
}

export interface TeamStats {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
  form: ('W' | 'D' | 'L')[]
  homeWins: number
  awayWins: number
  cleanSheets: number
  avgPossession: number
  avgShots: number
  avgShotsOnTarget: number
  xG: number
  xGA: number
}

export interface Player {
  id: string
  name: string
  team: string
  position: string
  nationality: string
  age: number
  stats: PlayerStats
}

export interface PlayerStats {
  goals: number
  assists: number
  appearances: number
  minutesPlayed: number
  passAccuracy: number
  shotsOnTarget: number
  dribbles: number
  tackles: number
  interceptions: number
  aerialDuels: number
  rating: number
  xG: number
  xA: number
}

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
  league: string
  status: 'FT' | 'LIVE' | 'NS' | 'HT'
  minute?: number
  events?: MatchEvent[]
  homeXG?: number
  awayXG?: number
  homePossession?: number
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution'
  team: 'home' | 'away'
  player: string
  detail?: string
}

export interface Prediction {
  homeTeam: string
  awayTeam: string
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  predictedHomeGoals: number
  predictedAwayGoals: number
  confidence: number
  factors: PredictionFactor[]
}

export interface PredictionFactor {
  name: string
  impact: number
  description: string
}

export interface SeasonData {
  week: number
  teamId: string
  points: number
  cumulativePoints: number
  goalsScored: number
  goalsAgainst: number
  xG: number
}
