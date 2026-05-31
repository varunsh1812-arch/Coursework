import { useState, useEffect, useCallback } from 'react'
import type { Match, MatchEvent } from '../types'
import { recentMatches } from '../data/matchesData'

interface LiveFeedState {
  liveMatches: Match[]
  latestEvents: (MatchEvent & { matchId: string; homeTeam: string; awayTeam: string })[]
  ticker: string[]
}

const eventCommentary = [
  (p: string, t: string) => `GOAL! ${p} scores for ${t}! What a finish!`,
  (p: string, t: string) => `Yellow card shown to ${p} of ${t}`,
  (p: string) => `Substitution: ${p} comes off the bench`,
  (p: string, t: string) => `${p} (${t}) wins the corner kick`,
  (p: string, t: string) => `Shot on target from ${p} – goalkeeper saves for ${t}!`
]

export function useLiveFeed(): LiveFeedState & { refresh: () => void } {
  const [liveMatches, setLiveMatches] = useState<Match[]>(
    recentMatches.filter(m => m.status === 'LIVE')
  )
  const [latestEvents, setLatestEvents] = useState<
    (MatchEvent & { matchId: string; homeTeam: string; awayTeam: string })[]
  >([])
  const [ticker, setTicker] = useState<string[]>([
    'LIVE: Man City 2-1 Arsenal (67\') | LIVE: Liverpool 4-2 Tottenham (FT)',
    'Premier League Round 34 underway',
    'Haaland scores his 27th league goal of the season!',
    'Arsenal still in title race – 2 points behind Man City',
    'Cole Palmer voted Premier League Player of the Month'
  ])

  const simulateLiveUpdate = useCallback(() => {
    setLiveMatches(prev =>
      prev.map(match => {
        if (match.status !== 'LIVE') return match
        const newMinute = Math.min(90, (match.minute || 60) + Math.floor(Math.random() * 3) + 1)
        const scored = Math.random() < 0.08
        const isHome = Math.random() > 0.5

        if (scored) {
          const newScore = {
            homeScore: isHome ? match.homeScore + 1 : match.homeScore,
            awayScore: !isHome ? match.awayScore + 1 : match.awayScore
          }
          const goalEvent: MatchEvent = {
            minute: newMinute,
            type: 'goal',
            team: isHome ? 'home' : 'away',
            player: isHome ? 'E. Haaland' : 'B. Saka',
            detail: 'Right foot shot'
          }
          setLatestEvents(prev => [
            { ...goalEvent, matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
            ...prev.slice(0, 9)
          ])
          setTicker(prev => [
            `GOAL! ${isHome ? match.homeTeam.toUpperCase() : match.awayTeam.toUpperCase()} score in minute ${newMinute}!`,
            ...prev.slice(0, 4)
          ])
          return { ...match, ...newScore, minute: newMinute }
        }

        return { ...match, minute: newMinute, status: newMinute >= 90 ? 'FT' : 'LIVE' }
      })
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(simulateLiveUpdate, 8000)
    return () => clearInterval(interval)
  }, [simulateLiveUpdate])

  return {
    liveMatches,
    latestEvents,
    ticker,
    refresh: simulateLiveUpdate
  }
}
