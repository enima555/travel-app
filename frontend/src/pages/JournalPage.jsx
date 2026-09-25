import { useState, useEffect } from 'react'
import { getJournal, createEntry, deleteEntry } from '../services/api'

export default function JournalPage({ trips }) {
  const [entries, setEntries] = useState([])
  const [tripId, setTripId] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchEntries = async () => {
    try { const res = await getJournal(); setEntries(res.data) } catch (e) {}
  }

  useEffect(() => { fetchEntries() }, [])
  useEffect(() => { if (trips.length && !tripId) setTripId(trips[0]?.id) }, [trips])

  const handleSubmit = async () => {
    if (!text.trim() || !tripId) return
    setLoading(true)
    try {
      await createEntry({ trip_id: Number(tripId), text })
      setText('')
      fetchEntries()
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    await deleteEntry(id)
    fetchEntries()
  }

  const tripName = (id) => {
    const t = trips.find(t => t.id === id)
    return t ? `${t.from_city} → ${t.to_city}` : 'Voyage inconnu'
  }

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-4">Nouvelle entrée</h2>
        <select className="input mb-3" value={tripId} onChange={e => setTripId(e.target.value)}>
          {trips.map(t => <option key={t.id} value={t.id}>{t.from_city} → {t.to_city}</option>)}
        </select>
        <textarea
          className="input mb-3"
          rows={4}
          style={{resize:'vertical'}}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Raconte ta journée, tes impressions, tes anecdotes..."
        />
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="space-y-3">
        {entries.map(e => (
          <div key={e.id} className="card border-l-4 border-l-blue-400" style={{borderRadius:'0 12px 12px 0'}}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-400">{String(e.date)} · {tripName(e.trip_id)}</p>
              </div>
              <button className="btn-danger text-xs" onClick={() => handleDelete(e.id)}>Supprimer</button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{e.text}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-gray-400 text-center py-8">Aucune entrée de journal.</p>}
      </div>
    </div>
  )
}
