import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Match, MatchEvent } from '../types'
import { recentMatches } from '../data/matchesData'
import { getPlayersByTeam } from '../data/playersData'

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

const GOAL_DETAILS = ['Right foot shot', 'Left foot shot', 'Header', 'Penalty', 'Tap-in']

// Pick a believable scorer from the team's squad, falling back gracefully if we have no
// players on file for that team (so the simulation works for any fixture, not just City–Arsenal).
function pickScorer(teamId: string): string {
  const squad = getPlayersByTeam(teamId)
  if (squad.length > 0) return squad[Math.floor(Math.random() * squad.length)].name
  return 'Forward'
}

// Loop the fixture when it reaches full time so the dashboard always has a live match to show.
function freshKickoff(match: Match): Match {
  return { ...match, homeScore: 0, awayScore: 0, minute: 1, status: 'LIVE', events: [], homePossession: 50 }
}

export function LiveFeedProvider({ children }: { children: ReactNode }) {
  const [liveMatches, setLiveMatches] = useState<Match[]>(
    recentMatches.filter(m => m.status === 'LIVE')
  )
  const [latestEvents, setLatestEvents] = useState<LiveEvent[]>([])
  const [ticker, setTicker] = useState<string[]>(INITIAL_TICKER)

  // Mirror the latest matches in a ref so the interval callback always reads current state
  // and we can compute the next state as a plain value — never calling setState inside another
  // setState's updater (which would double-fire under StrictMode and duplicate goal events).
  const matchesRef = useRef(liveMatches)
  matchesRef.current = liveMatches

  const simulateLiveUpdate = useCallback(() => {
    const newEvents: LiveEvent[] = []
    const newTicker: string[] = []

    const updated = matchesRef.current.map(match => {
      if (match.status !== 'LIVE') return match

      const nextMinute = (match.minute ?? 0) + Math.floor(Math.random() * 3) + 1
      if (nextMinute >= 90) return freshKickoff(match)

      if (Math.random() < 0.12) {
        const isHome = Math.random() > 0.5
        const scoringTeam = isHome ? match.homeTeam : match.awayTeam
        const goalEvent: MatchEvent = {
          minute: nextMinute,
          type: 'goal',
          team: isHome ? 'home' : 'away',
          player: pickScorer(scoringTeam),
          detail: GOAL_DETAILS[Math.floor(Math.random() * GOAL_DETAILS.length)]
        }
        newEvents.push({ ...goalEvent, matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam })
        newTicker.push(`GOAL! ${goalEvent.player} (${scoringTeam.toUpperCase()}) ${nextMinute}'`)
        return {
          ...match,
          minute: nextMinute,
          homeScore: isHome ? match.homeScore + 1 : match.homeScore,
          awayScore: isHome ? match.awayScore : match.awayScore + 1,
          events: [...(match.events || []), goalEvent]
        }
      }

      return { ...match, minute: nextMinute }
    })

    setLiveMatches(updated)
    if (newEvents.length) setLatestEvents(prev => [...newEvents, ...prev].slice(0, 10))
    if (newTicker.length) setTicker(prev => [...newTicker, ...prev].slice(0, 6))
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
