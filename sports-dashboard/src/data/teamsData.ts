import type { Team } from '../types'

export const premierLeagueTeams: Team[] = [
  {
    id: 'mci', name: 'Manchester City', shortName: 'MCI', logo: '🔵',
    color: '#6CABDD', league: 'Premier League', eloRating: 2050,
    stats: {
      played: 36, wins: 26, draws: 5, losses: 5,
      goalsFor: 93, goalsAgainst: 38, points: 83,
      form: ['W', 'W', 'D', 'W', 'W'],
      homeWins: 15, awayWins: 11, cleanSheets: 16,
      avgPossession: 63.2, avgShots: 18.4, avgShotsOnTarget: 7.8,
      xG: 88.4, xGA: 34.2
    }
  },
  {
    id: 'ars', name: 'Arsenal', shortName: 'ARS', logo: '🔴',
    color: '#EF0107', league: 'Premier League', eloRating: 2010,
    stats: {
      played: 36, wins: 25, draws: 6, losses: 5,
      goalsFor: 87, goalsAgainst: 32, points: 81,
      form: ['W', 'W', 'W', 'D', 'W'],
      homeWins: 14, awayWins: 11, cleanSheets: 17,
      avgPossession: 59.8, avgShots: 17.2, avgShotsOnTarget: 7.1,
      xG: 84.1, xGA: 31.8
    }
  },
  {
    id: 'liv', name: 'Liverpool', shortName: 'LIV', logo: '🔴',
    color: '#C8102E', league: 'Premier League', eloRating: 1990,
    stats: {
      played: 36, wins: 24, draws: 5, losses: 7,
      goalsFor: 82, goalsAgainst: 41, points: 77,
      form: ['W', 'L', 'W', 'W', 'D'],
      homeWins: 13, awayWins: 11, cleanSheets: 12,
      avgPossession: 56.4, avgShots: 16.8, avgShotsOnTarget: 6.9,
      xG: 78.9, xGA: 38.5
    }
  },
  {
    id: 'avl', name: 'Aston Villa', shortName: 'AVL', logo: '🟣',
    color: '#95BFE5', league: 'Premier League', eloRating: 1840,
    stats: {
      played: 36, wins: 20, draws: 6, losses: 10,
      goalsFor: 74, goalsAgainst: 56, points: 66,
      form: ['W', 'D', 'L', 'W', 'W'],
      homeWins: 12, awayWins: 8, cleanSheets: 9,
      avgPossession: 52.1, avgShots: 14.9, avgShotsOnTarget: 5.8,
      xG: 68.3, xGA: 52.1
    }
  },
  {
    id: 'tot', name: 'Tottenham', shortName: 'TOT', logo: '⚪',
    color: '#132257', league: 'Premier League', eloRating: 1810,
    stats: {
      played: 36, wins: 19, draws: 4, losses: 13,
      goalsFor: 68, goalsAgainst: 59, points: 61,
      form: ['L', 'W', 'W', 'D', 'L'],
      homeWins: 11, awayWins: 8, cleanSheets: 8,
      avgPossession: 54.3, avgShots: 15.2, avgShotsOnTarget: 5.4,
      xG: 65.7, xGA: 57.3
    }
  },
  {
    id: 'che', name: 'Chelsea', shortName: 'CHE', logo: '🔵',
    color: '#034694', league: 'Premier League', eloRating: 1790,
    stats: {
      played: 36, wins: 18, draws: 7, losses: 11,
      goalsFor: 71, goalsAgainst: 59, points: 61,
      form: ['D', 'W', 'W', 'L', 'W'],
      homeWins: 10, awayWins: 8, cleanSheets: 7,
      avgPossession: 57.6, avgShots: 16.1, avgShotsOnTarget: 6.2,
      xG: 67.4, xGA: 55.8
    }
  },
  {
    id: 'new', name: 'Newcastle', shortName: 'NEW', logo: '⚫',
    color: '#241F20', league: 'Premier League', eloRating: 1800,
    stats: {
      played: 36, wins: 18, draws: 6, losses: 12,
      goalsFor: 80, goalsAgainst: 62, points: 60,
      form: ['W', 'W', 'L', 'W', 'D'],
      homeWins: 12, awayWins: 6, cleanSheets: 10,
      avgPossession: 50.4, avgShots: 15.8, avgShotsOnTarget: 6.0,
      xG: 72.1, xGA: 58.4
    }
  },
  {
    id: 'mun', name: 'Man United', shortName: 'MUN', logo: '🔴',
    color: '#DA291C', league: 'Premier League', eloRating: 1780,
    stats: {
      played: 36, wins: 14, draws: 6, losses: 16,
      goalsFor: 39, goalsAgainst: 54, points: 48,
      form: ['L', 'D', 'W', 'L', 'W'],
      homeWins: 9, awayWins: 5, cleanSheets: 8,
      avgPossession: 55.2, avgShots: 13.4, avgShotsOnTarget: 4.8,
      xG: 42.3, xGA: 51.7
    }
  }
]

const teamsById = new Map(premierLeagueTeams.map(t => [t.id, t]))

// Single shared lookup so components don't each re-implement `premierLeagueTeams.find(...)`.
export const getTeam = (id: string): Team | undefined => teamsById.get(id)
