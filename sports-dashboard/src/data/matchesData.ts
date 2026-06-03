import type { Match, SeasonData } from '../types'

export const recentMatches: Match[] = [
  {
    id: 'm1', homeTeam: 'mci', awayTeam: 'ars', homeScore: 0, awayScore: 0,
    date: '2024-03-31', league: 'Premier League', status: 'LIVE', minute: 67,
    homeXG: 1.8, awayXG: 0.9, homePossession: 61,
    events: [
      { minute: 23, type: 'goal', team: 'home', player: 'E. Haaland', detail: 'Right foot shot' },
      { minute: 45, type: 'yellow_card', team: 'away', player: 'T. Partey' },
      { minute: 54, type: 'goal', team: 'away', player: 'B. Saka', detail: 'Left foot shot' },
      { minute: 61, type: 'goal', team: 'home', player: 'K. De Bruyne', detail: 'Header' }
    ]
  },
  {
    id: 'm2', homeTeam: 'liv', awayTeam: 'tot', homeScore: 4, awayScore: 2,
    date: '2024-03-30', league: 'Premier League', status: 'FT',
    homeXG: 3.4, awayXG: 1.8, homePossession: 56,
    events: [
      { minute: 12, type: 'goal', team: 'home', player: 'M. Salah' },
      { minute: 34, type: 'goal', team: 'away', player: 'H. Son' },
      { minute: 51, type: 'goal', team: 'home', player: 'D. Nunez' },
      { minute: 63, type: 'goal', team: 'home', player: 'M. Salah' },
      { minute: 78, type: 'goal', team: 'away', player: 'D. Richarlison' },
      { minute: 88, type: 'goal', team: 'home', player: 'L. Diaz' }
    ]
  },
  {
    id: 'm3', homeTeam: 'che', awayTeam: 'new', homeScore: 2, awayScore: 2,
    date: '2024-03-30', league: 'Premier League', status: 'FT',
    homeXG: 2.1, awayXG: 2.4, homePossession: 53
  },
  {
    id: 'm4', homeTeam: 'avl', awayTeam: 'mun', homeScore: 3, awayScore: 1,
    date: '2024-03-29', league: 'Premier League', status: 'FT',
    homeXG: 2.8, awayXG: 0.9, homePossession: 58
  },
  {
    id: 'm5', homeTeam: 'tot', awayTeam: 'mci', homeScore: 0, awayScore: 2,
    date: '2024-03-27', league: 'Premier League', status: 'FT',
    homeXG: 0.7, awayXG: 2.2, homePossession: 42
  },
  {
    id: 'm6', homeTeam: 'ars', awayTeam: 'liv', homeScore: 2, awayScore: 2,
    date: '2024-03-26', league: 'Premier League', status: 'FT',
    homeXG: 1.9, awayXG: 2.1, homePossession: 55
  }
]

export const upcomingMatches: Match[] = [
  {
    id: 'u1', homeTeam: 'ars', awayTeam: 'mci', homeScore: 0, awayScore: 0,
    date: '2024-04-06', league: 'Premier League', status: 'NS'
  },
  {
    id: 'u2', homeTeam: 'liv', awayTeam: 'mun', homeScore: 0, awayScore: 0,
    date: '2024-04-07', league: 'Premier League', status: 'NS'
  },
  {
    id: 'u3', homeTeam: 'tot', awayTeam: 'avl', homeScore: 0, awayScore: 0,
    date: '2024-04-07', league: 'Premier League', status: 'NS'
  },
  {
    id: 'u4', homeTeam: 'new', awayTeam: 'che', homeScore: 0, awayScore: 0,
    date: '2024-04-08', league: 'Premier League', status: 'NS'
  }
]

// 36 weeks of season data for 4 top teams
export const seasonProgressData: SeasonData[] = (() => {
  const teams = [
    { id: 'mci', baseXG: 2.4, winRate: 0.72, color: '#6CABDD' },
    { id: 'ars', baseXG: 2.3, winRate: 0.70, color: '#EF0107' },
    { id: 'liv', baseXG: 2.2, winRate: 0.67, color: '#C8102E' },
    { id: 'avl', baseXG: 2.0, winRate: 0.56, color: '#95BFE5' }
  ]

  const data: SeasonData[] = []
  const rng = (seed: number) => {
    const x = Math.sin(seed + 1) * 10000
    return x - Math.floor(x)
  }

  teams.forEach((team, ti) => {
    let cumPoints = 0
    for (let week = 1; week <= 36; week++) {
      const r = rng(week * 100 + ti * 13)
      const isWin = r < team.winRate
      const isDraw = !isWin && r < team.winRate + 0.15
      const pts = isWin ? 3 : isDraw ? 1 : 0
      cumPoints += pts
      data.push({
        week,
        teamId: team.id,
        points: pts,
        cumulativePoints: cumPoints,
        goalsScored: isWin ? Math.floor(rng(week * 200 + ti) * 3) + 1 : isDraw ? 1 : 0,
        goalsAgainst: isWin ? 0 : isDraw ? 1 : Math.floor(rng(week * 300 + ti) * 2) + 1,
        xG: parseFloat((team.baseXG + (rng(week * 50 + ti) - 0.5) * 1.2).toFixed(2))
      })
    }
  })
  return data
})()
