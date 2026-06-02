import { useState } from 'react'
import LiveScoreTicker from './components/LiveScoreTicker'
import OverviewDashboard from './components/OverviewDashboard'
import TeamAnalytics from './components/TeamAnalytics'
import PlayerAnalytics from './components/PlayerAnalytics'
import PredictionPanel from './components/PredictionPanel'
import LiveFeedPanel from './components/LiveFeedPanel'
import { useLiveFeed } from './context/LiveFeedContext'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'live', label: 'Live', icon: '📡' },
  { id: 'predictions', label: 'Predictions', icon: '🤖' },
  { id: 'teams', label: 'Teams', icon: '📊' },
  { id: 'players', label: 'Players', icon: '⚽' }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const { liveMatches, ticker } = useLiveFeed()

  const liveCount = liveMatches.filter(m => m.status === 'LIVE').length

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-lg">
              ⚽
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">SportIQ Analytics</h1>
              <p className="text-xs text-gray-500 leading-tight">Prediction · Live · Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-fast" />
                <span className="text-xs text-red-400 font-medium">{liveCount} LIVE</span>
              </div>
            )}
            <div className="text-xs text-gray-500 hidden sm:block">
              Premier League · Season 2023/24
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'live' && liveCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {liveCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Live Score Ticker */}
      <LiveScoreTicker liveMatches={liveMatches} ticker={ticker} />

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        {activeTab === 'overview' && (
          <OverviewDashboard liveMatches={liveMatches} onTabChange={setActiveTab} />
        )}
        {activeTab === 'live' && <LiveFeedPanel />}
        {activeTab === 'predictions' && <PredictionPanel />}
        {activeTab === 'teams' && <TeamAnalytics />}
        {activeTab === 'players' && <PlayerAnalytics />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-dark-700 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>SportIQ Analytics — Built with React, Chart.js, Elo Ratings & Poisson Distribution</span>
          <span>Data is simulated for demonstration purposes</span>
        </div>
      </footer>
    </div>
  )
}
