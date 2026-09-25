import { useState, useEffect } from 'react'
import { getTrips, updateTrip } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const CAT_OPTIONS = ['Vol', 'Hôtel', 'Repas', 'Transport', 'Activités', 'Shopping', 'Autre']

export default function BudgetPage() {
  const [trips, setTrips] = useState([])
  const [selected, setSelected] = useState(null)
  const [newExp, setNewExp] = useState({ cat: 'Vol', amount: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrips().then(data => {
      setTrips(data)
      if (data.length > 0) setSelected(data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  const trip = trips.find(t => t.id === selected)

  const addExpense = async () => {
    if (!newExp.amount || !trip) return
    const expenses = [...(trip.expenses || []), { cat: newExp.cat, amount: Number(newExp.amount) }]
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const updated = await updateTrip(trip.id, { expenses, spent })
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t))
    setNewExp({ cat: 'Vol', amount: '' })
  }

  const removeExpense = async (idx) => {
    if (!trip) return
    const expenses = trip.expenses.filter((_, i) => i !== idx)
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const updated = await updateTrip(trip.id, { expenses, spent })
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const pieData = trip?.expenses?.reduce((acc, e) => {
    const ex = acc.find(a => a.name === e.cat)
    if (ex) ex.value += e.amount
    else acc.push({ name: e.cat, value: e.amount })
    return acc
  }, []) || []

  const barData = trips.map(t => ({
    name: `${t.from_city}→${t.to_city}`,
    Budget: t.budget,
    Dépensé: t.spent,
  }))

  if (loading) return <p className="text-center text-gray-500">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion du Budget</h1>

      {/* Comparaison globale */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Comparaison Budget / Dépenses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v) => `${v}€`} />
            <Legend />
            <Bar dataKey="Budget" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="Dépensé" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Détail par voyage */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold">Détail par voyage :</h2>
          <select className="border rounded px-3 py-1 text-sm" value={selected || ''}
            onChange={e => setSelected(Number(e.target.value))}>
            {trips.map(t => <option key={t.id} value={t.id}>{t.from_city} → {t.to_city}</option>)}
          </select>
        </div>

        {trip && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-xl font-bold text-blue-600">{trip.budget}€</p>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Dépensé</p>
                  <p className={`text-xl font-bold ${trip.spent > trip.budget ? 'text-red-600' : 'text-green-600'}`}>{trip.spent}€</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Restant</p>
                  <p className={`text-xl font-bold ${trip.budget - trip.spent < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {trip.budget - trip.spent}€
                  </p>
                </div>
              </div>

              {/* Ajouter une dépense */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Ajouter une dépense</p>
                <div className="flex gap-2">
                  <select className="border rounded px-2 py-1 text-sm flex-1" value={newExp.cat}
                    onChange={e => setNewExp(p => ({ ...p, cat: e.target.value }))}>
                    {CAT_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Montant €" className="border rounded px-2 py-1 text-sm w-24"
                    value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))} />
                  <button onClick={addExpense} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">+</button>
                </div>
              </div>

              {/* Liste dépenses */}
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {(trip.expenses || []).map((e, i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-600">{e.cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{e.amount}€</span>
                      <button onClick={() => removeExpense(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pie chart */}
            <div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}€`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Aucune dépense enregistrée
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
