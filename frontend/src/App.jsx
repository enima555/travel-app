import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TripsPage from './pages/TripsPage'
import BudgetPage from './pages/BudgetPage'
import JournalPage from './pages/JournalPage'
import GmailPage from './pages/GmailPage'
import AIPage from './pages/AIPage'
import { getTrips } from './services/api'

const navItems = [
  { to: '/', label: '✈️ Voyages' },
  { to: '/budget', label: '💰 Budget' },
  { to: '/journal', label: '📓 Journal' },
  { to: '/gmail', label: '📧 Gmail' },
  { to: '/ai', label: '🤖 IA' },
]

export default function App() {
  const [trips, setTrips] = useState([])

  const fetchTrips = async () => {
    try {
      const res = await getTrips()
      setTrips(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error(e)
      setTrips([])
    }
  }

  useEffect(() => { fetchTrips() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mes Voyages</h1>
            <p className="text-xs text-gray-400">{trips.length} voyage{trips.length !== 1 ? 's' : ''} enregistré{trips.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<TripsPage trips={trips} onRefresh={fetchTrips} />} />
          <Route path="/budget" element={<BudgetPage trips={trips} />} />
          <Route path="/journal" element={<JournalPage trips={trips} />} />
          <Route path="/gmail" element={<GmailPage onTripsImported={fetchTrips} />} />
          <Route path="/ai" element={<AIPage trips={trips} />} />
        </Routes>
      </main>
    </div>
  )
}
