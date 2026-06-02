import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Match, MatchEvent } from '../types'
import { recentMatches } from '../data/matchesData'

export type LiveEvent = MatchEvent & { matchId: string; homeTeam: string; awayTeam: string }

interface LiveFeedValue {
  liveMatches: Match[]
  latestEvents: LiveEvent[]
  ticker: string[]
  refresh: () => void
}

const LiveFeedContext = createContext<LiveFeedValue | null>(null)

const INITIAL_TICKER = [
  'LIVE: Man City vs Arsenal — title race showdown underway',
  'Premier League Round 34 in progress',
  'Haaland scores his 27th league goal of the season!',
  'Arsenal still in title race – 2 points behind Man City',
  'Cole Palmer voted Premier League Player of the Month'
]

export function LiveFeedProvider({ children }: { children: ReactNode }) {
  const [liveMatches, setLiveMatches] = useState<Match[]>(
    recentMatches.filter(m => m.status === 'LIVE')
  )
  const [latestEvents, setLatestEvents] = useState<LiveEvent[]>([])
  const [ticker, setTicker] = useState<string[]>(INITIAL_TICKER)

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
          setLatestEvents(prevEvents => [
            { ...goalEvent, matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
            ...prevEvents.slice(0, 9)
          ])
          setTicker(prevTicker => [
            `GOAL! ${isHome ? match.homeTeam.toUpperCase() : match.awayTeam.toUpperCase()} score in minute ${newMinute}!`,
            ...prevTicker.slice(0, 4)
          ])
          return { ...match, ...newScore, minute: newMinute, events: [...(match.events || []), goalEvent] }
        }

        return { ...match, minute: newMinute, status: newMinute >= 90 ? 'FT' : 'LIVE' }
      })
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(simulateLiveUpdate, 8000)
    return () => clearInterval(interval)
  }, [simulateLiveUpdate])

  return (
    <LiveFeedContext.Provider value={{ liveMatches, latestEvents, ticker, refresh: simulateLiveUpdate }}>
      {children}
    </LiveFeedContext.Provider>
  )
}

export function useLiveFeed(): LiveFeedValue {
  const ctx = useContext(LiveFeedContext)
  if (!ctx) throw new Error('useLiveFeed must be used within a LiveFeedProvider')
  return ctx
}
