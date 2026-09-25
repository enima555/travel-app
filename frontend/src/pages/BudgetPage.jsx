import { useState, useEffect } from 'react'
import { getTrips, updateTrip } from '../services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const CAT_OPTIONS = ['Vol', 'Hotel', 'Repas', 'Transport', 'Activites', 'Shopping', 'Autre']

export default function BudgetPage() {
  const [trips, setTrips] = useState([])
  const [selected, setSelected] = useState(null)
  const [newExp, setNewExp] = useState({ cat: 'Vol', amount: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrips().then(data => {
      const safe = (data || []).map(t => ({
        ...t,
        expenses: Array.isArray(t.expenses) ? t.expenses : [],
        budget: t.budget || 0,
        spent: t.spent || 0
      }))
      setTrips(safe)
      if (safe.length > 0) setSelected(safe[0].id)
    }).catch(() => setTrips([])).finally(() => setLoading(false))
  }, [])

  const trip = trips.find(t => t.id === selected)

  const addExpense = async () => {
    if (!newExp.amount || !trip) return
    const expenses = [...(trip.expenses || []), { cat: newExp.cat, amount: Number(newExp.amount) }]
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const updated = await updateTrip(trip.id, { expenses, spent })
    const safeUpdated = { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
    setTrips(prev => prev.map(t => t.id === safeUpdated.id ? safeUpdated : t))
    setNewExp({ cat: 'Vol', amount: '' })
  }

  const removeExpense = async (idx) => {
    if (!trip) return
    const expenses = trip.expenses.filter((_, i) => i !== idx)
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const updated = await updateTrip(trip.id, { expenses, spent })
    const safeUpdated = { ...updated, expenses: Array.isArray(updated.expenses) ? updated.expenses : [] }
    setTrips(prev => prev.map(t => t.id === safeUpdated.id ? safeUpdated : t))
  }

  const expenses = trip?.expenses || []
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const catTotals = expenses.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] || 0) + e.amount
    return acc
  }, {})

  if (loading) return <p className="text-center text-gray-500">Chargement...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion du Budget</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Comparaison Budget / Depenses</h2>
        <div className="space-y-3">
          {trips.map(t => (
            <div key={t.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{t.from_city} vers {t.to_city}</span>
                <span className={t.spent > t.budget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {t.spent}EUR / {t.budget}EUR
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.spent > t.budget ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: t.budget > 0 ? `${Math.min((t.spent / t.budget) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold">Detail par voyage :</h2>
          <select className="border rounded px-3 py-1 text-sm" value={selected || ''}
            onChange={e => setSelected(Number(e.target.value))}>
            {trips.map(t => <option key={t.id} value={t.id}>{t.from_city} vers {t.to_city}</option>)}
          </select>
        </div>

        {trip && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-xl font-bold text-blue-600">{trip.budget}EUR</p>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Depense</p>
                  <p className={`text-xl font-bold ${trip.spent > trip.budget ? 'text-red-600' : 'text-green-600'}`}>{trip.spent}EUR</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Restant</p>
                  <p className={`text-xl font-bold ${trip.budget - trip.spent < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {trip.budget - trip.spent}EUR
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Ajouter une depense</p>
                <div className="flex gap-2">
                  <select className="border rounded px-2 py-1 text-sm flex-1" value={newExp.cat}
                    onChange={e => setNewExp(p => ({ ...p, cat: e.target.value }))}>
                    {CAT_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Montant" className="border rounded px-2 py-1 text-sm w-24"
                    value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))} />
                  <button onClick={addExpense} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">+</button>
                </div>
              </div>

              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {expenses.map((e, i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-600">{e.cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{e.amount}EUR</span>
                      <button onClick={() => removeExpense(i)} className="text-red-400 hover:text-red-600 text-xs">X</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {Object.keys(catTotals).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Repartition par categorie</p>
                  {Object.entries(catTotals).map(([cat, amount], i) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-medium">{amount}EUR ({totalSpent > 0 ? Math.round(amount / totalSpent * 100) : 0}%)</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: totalSpent > 0 ? `${(amount / totalSpent) * 100}%` : '0%',
                            backgroundColor: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Aucune depense enregistree
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
