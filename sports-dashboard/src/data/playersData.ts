import type { Player } from '../types'

export const topPlayers: Player[] = [
  {
    id: 'haaland', name: 'Erling Haaland', team: 'mci',
    position: 'ST', nationality: 'Norwegian', age: 23,
    stats: {
      goals: 27, assists: 5, appearances: 31, minutesPlayed: 2654,
      passAccuracy: 74.2, shotsOnTarget: 72, dribbles: 28,
      tackles: 4, interceptions: 3, aerialDuels: 62,
      rating: 8.4, xG: 25.1, xA: 4.8
    }
  },
  {
    id: 'salah', name: 'Mohamed Salah', team: 'liv',
    position: 'RW', nationality: 'Egyptian', age: 31,
    stats: {
      goals: 18, assists: 11, appearances: 34, minutesPlayed: 2891,
      passAccuracy: 80.4, shotsOnTarget: 58, dribbles: 84,
      tackles: 12, interceptions: 14, aerialDuels: 22,
      rating: 8.1, xG: 16.2, xA: 9.8
    }
  },
  {
    id: 'saka', name: 'Bukayo Saka', team: 'ars',
    position: 'RW', nationality: 'English', age: 22,
    stats: {
      goals: 16, assists: 9, appearances: 35, minutesPlayed: 2978,
      passAccuracy: 82.1, shotsOnTarget: 48, dribbles: 96,
      tackles: 22, interceptions: 18, aerialDuels: 18,
      rating: 8.0, xG: 14.8, xA: 8.9
    }
  },
  {
    id: 'watkins', name: 'Ollie Watkins', team: 'avl',
    position: 'ST', nationality: 'English', age: 28,
    stats: {
      goals: 19, assists: 13, appearances: 35, minutesPlayed: 2934,
      passAccuracy: 71.8, shotsOnTarget: 54, dribbles: 42,
      tackles: 8, interceptions: 7, aerialDuels: 51,
      rating: 7.9, xG: 17.4, xA: 11.2
    }
  },
  {
    id: 'trossard', name: 'Leandro Trossard', team: 'ars',
    position: 'LW', nationality: 'Belgian', age: 29,
    stats: {
      goals: 12, assists: 8, appearances: 33, minutesPlayed: 2342,
      passAccuracy: 83.4, shotsOnTarget: 38, dribbles: 72,
      tackles: 18, interceptions: 15, aerialDuels: 14,
      rating: 7.6, xG: 11.2, xA: 7.4
    }
  },
  {
    id: 'foden', name: 'Phil Foden', team: 'mci',
    position: 'CAM', nationality: 'English', age: 23,
    stats: {
      goals: 14, assists: 8, appearances: 30, minutesPlayed: 2456,
      passAccuracy: 86.2, shotsOnTarget: 44, dribbles: 88,
      tackles: 16, interceptions: 12, aerialDuels: 10,
      rating: 7.8, xG: 12.8, xA: 8.1
    }
  },
  {
    id: 'isak', name: 'Alexander Isak', team: 'new',
    position: 'ST', nationality: 'Swedish', age: 24,
    stats: {
      goals: 21, assists: 4, appearances: 33, minutesPlayed: 2801,
      passAccuracy: 73.6, shotsOnTarget: 61, dribbles: 56,
      tackles: 6, interceptions: 5, aerialDuels: 44,
      rating: 7.9, xG: 19.2, xA: 3.8
    }
  },
  {
    id: 'palmer', name: 'Cole Palmer', team: 'che',
    position: 'CAM', nationality: 'English', age: 22,
    stats: {
      goals: 22, assists: 11, appearances: 34, minutesPlayed: 2934,
      passAccuracy: 84.8, shotsOnTarget: 64, dribbles: 91,
      tackles: 14, interceptions: 11, aerialDuels: 12,
      rating: 8.2, xG: 19.8, xA: 10.4
    }
  }
]

export const getPlayersByTeam = (teamId: string) =>
  topPlayers.filter(p => p.team === teamId)
