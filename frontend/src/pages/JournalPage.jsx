import { useState, useEffect } from 'react'
import { getJournal, getTrips, createEntry, deleteEntry } from '../services/api'

export default function JournalPage() {
  const [entries, setEntries] = useState([])
  const [trips, setTrips] = useState([])
  const [form, setForm] = useState({ trip_id: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getJournal(), getTrips()]).then(([e, t]) => {
      const safeEntries = Array.isArray(e) ? e : []
      const safeTrips = Array.isArray(t) ? t : []
      setEntries(safeEntries)
      setTrips(safeTrips)
      if (safeTrips.length > 0) setForm(p => ({ ...p, trip_id: safeTrips[0].id }))
    }).catch(() => { setEntries([]); setTrips([]) }).finally(() => setLoading(false))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.text.trim()) return
    const entry = await createEntry({ trip_id: Number(form.trip_id), text: form.text })
    setEntries(prev => [entry, ...prev])
    setForm(p => ({ ...p, text: '' }))
  }

  const remove = async (id) => {
    await deleteEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const tripName = (id) => {
    const t = trips.find(t => t.id === id)
    return t ? `${t.from_city} → ${t.to_city}` : 'Voyage inconnu'
  }

  if (loading) return <p className="text-center text-gray-500">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📔 Journal de Voyage</h1>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Nouvelle entrée</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Voyage</label>
          <select className="w-full border rounded px-3 py-2" value={form.trip_id}
            onChange={e => setForm(p => ({ ...p, trip_id: e.target.value }))}>
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.from_city} → {t.to_city} ({t.start})</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mon souvenir</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Décrivez votre journée, une rencontre, une découverte..."
            value={form.text}
            onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
          Enregistrer
        </button>
      </form>

      <div className="space-y-4">
        {entries.map(e => (
          <div key={e.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {tripName(e.trip_id)}
                </span>
                <span className="text-xs text-gray-400 ml-2">{e.date}</span>
              </div>
              <button onClick={() => remove(e.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
            </div>
            <p className="text-gray-700 mt-2 leading-relaxed">{e.text}</p>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📔</p>
          <p className="text-lg">Votre journal est vide</p>
          <p className="text-sm">Commencez à noter vos souvenirs de voyage</p>
        </div>
      )}
    </div>
  )
}
