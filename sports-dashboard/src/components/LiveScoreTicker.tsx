import { useRef, useEffect } from 'react'
import { recentMatches } from '../data/matchesData'
import { premierLeagueTeams } from '../data/teamsData'

interface Props {
  liveMatches: typeof recentMatches
  ticker: string[]
}

export default function LiveScoreTicker({ liveMatches, ticker }: Props) {
  const getTeam = (id: string) => premierLeagueTeams.find(t => t.id === id)

  const tickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tickerRef.current
    if (!el) return
    let pos = el.scrollWidth
    let frame: number
    const step = () => {
      pos -= 1
      if (pos < -el.scrollWidth) pos = window.innerWidth
      el.style.transform = `translateX(${pos}px)`
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [ticker])

  return (
    <div className="bg-dark-800 border-b border-dark-600">
      {/* Live Score Cards */}
      <div className="flex gap-3 p-3 overflow-x-auto scrollbar-hide">
        {liveMatches.map(match => {
          const home = getTeam(match.homeTeam)
          const away = getTeam(match.awayTeam)
          return (
            <div
              key={match.id}
              className="flex-shrink-0 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 flex items-center gap-3 min-w-[220px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{home?.logo}</span>
                <span className="text-white text-sm font-medium">{home?.shortName}</span>
              </div>
              <div className="text-center">
                {match.status === 'LIVE' ? (
                  <>
                    <div className="text-white font-bold text-lg leading-tight">
                      {match.homeScore} – {match.awayScore}
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-fast" />
                      <span className="text-red-400 text-xs font-semibold">{match.minute}'</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white font-bold text-lg leading-tight">
                      {match.homeScore} – {match.awayScore}
                    </div>
                    <div className="text-gray-400 text-xs">FT</div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">{away?.shortName}</span>
                <span className="text-lg">{away?.logo}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrolling Ticker */}
      <div className="bg-primary-900 overflow-hidden py-1 relative border-t border-primary-700">
        <div className="inline-flex gap-8 whitespace-nowrap" ref={tickerRef} style={{ willChange: 'transform' }}>
          {[...ticker, ...ticker].map((item, i) => (
            <span key={i} className="text-xs text-blue-200 font-medium">
              <span className="text-yellow-400 mr-2">●</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
