import { useState, useEffect } from 'react'
import { getTrips, createTrip, deleteTrip } from '../services/api'

const STATUS_LABELS = { planning: '🗓️ Planifié', upcoming: '⏳ À venir', past: '✅ Passé' }
const STATUS_COLORS = { planning: 'bg-yellow-100 text-yellow-800', upcoming: 'bg-blue-100 text-blue-800', past: 'bg-green-100 text-green-800' }

const empty = { from_city: '', to_city: '', start: '', end: '', budget: '', notes: '', status: 'planning', spent: 0, expenses: [] }

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getTrips().then(data => setTrips(Array.isArray(data) ? data : [])).catch(() => setTrips([])).finally(() => setLoading(false)) }, [])

  const submit = async (e) => {
    e.preventDefault()
    const t = await createTrip({ ...form, budget: Number(form.budget) || 0 })
    setTrips(prev => [...prev, t])
    setForm(empty)
    setShowForm(false)
  }

  const remove = async (id) => {
    await deleteTrip(id)
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return <p className="text-center text-gray-500">Chargement…</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mes Voyages</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? 'Annuler' : '+ Nouveau voyage'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville de départ *</label>
            <input required className="w-full border rounded px-3 py-2" value={form.from_city}
              onChange={e => setForm(p => ({ ...p, from_city: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
            <input required className="w-full border rounded px-3 py-2" value={form.to_city}
              onChange={e => setForm(p => ({ ...p, to_city: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ *</label>
            <input required type="date" className="w-full border rounded px-3 py-2" value={form.start}
              onChange={e => setForm(p => ({ ...p, start: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={form.end}
              onChange={e => setForm(p => ({ ...p, end: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={form.budget}
              onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select className="w-full border rounded px-3 py-2" value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="planning">Planifié</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passé</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full border rounded px-3 py-2" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">
              Ajouter le voyage
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map(t => (
          <div key={t.id} className="bg-white rounded-xl shadow hover:shadow-md transition p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t.from_city} → {t.to_city}</h2>
                <p className="text-sm text-gray-500">{t.start} {t.end ? `→ ${t.end}` : ''}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[t.status] || t.status}
              </span>
            </div>
            {t.budget > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Budget</span>
                  <span className={t.spent > t.budget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {t.spent}€ / {t.budget}€
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.spent > t.budget ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((t.spent / t.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {t.notes && <p className="text-sm text-gray-500 mt-2 italic">"{t.notes}"</p>}
            <button onClick={() => remove(t.id)} className="mt-3 text-xs text-red-400 hover:text-red-600">
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">✈️</p>
          <p className="text-lg">Aucun voyage pour l'instant</p>
          <p className="text-sm">Cliquez sur "+ Nouveau voyage" pour commencer</p>
        </div>
      )}
    </div>
  )
}
