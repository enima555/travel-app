import { useState } from 'react'
import { createTrip, deleteTrip } from '../services/api'

const STATUS_LABELS = { planning: 'En planification', upcoming: 'À venir', past: 'Passé' }
const STATUS_COLORS = {
  planning: 'bg-amber-50 text-amber-700',
  upcoming: 'bg-blue-50 text-blue-700',
  past: 'bg-gray-100 text-gray-600',
}

export default function TripsPage({ trips, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ from_city: '', to_city: '', start: '', end: '', budget: '', status: 'planning', notes: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.from_city || !form.to_city || !form.start) return alert('Départ, destination et date requis.')
    setLoading(true)
    try {
      await createTrip({ ...form, budget: Number(form.budget) || 0 })
      setForm({ from_city: '', to_city: '', start: '', end: '', budget: '', status: 'planning', notes: '' })
      setShowForm(false)
      onRefresh()
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce voyage ?')) return
    await deleteTrip(id)
    onRefresh()
  }

  const total_spent = trips.reduce((s, t) => s + (t.spent || 0), 0)
  const destinations = [...new Set(trips.map(t => t.to_city))].length

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Voyages', value: trips.length },
          { label: 'Budget dépensé', value: `${total_spent.toLocaleString('fr-FR')} €` },
          { label: 'Destinations', value: destinations },
        ].map(m => (
          <div key={m.label} className="card">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className="text-2xl font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium text-gray-700">Tous les voyages</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h3 className="font-medium mb-4">Nouveau voyage</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Départ</label><input className="input" value={form.from_city} onChange={e => set('from_city', e.target.value)} placeholder="Alger..." /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Destination</label><input className="input" value={form.to_city} onChange={e => set('to_city', e.target.value)} placeholder="Paris..." /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Date départ</label><input className="input" type="date" value={form.start} onChange={e => set('start', e.target.value)} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Date retour</label><input className="input" type="date" value={form.end} onChange={e => set('end', e.target.value)} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Budget (€)</label><input className="input" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Statut</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="planning">En planification</option>
                <option value="upcoming">À venir</option>
                <option value="past">Passé</option>
              </select>
            </div>
          </div>
          <input className="input mb-3" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes..." />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
            <button className="btn" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {trips.map(t => (
          <div key={t.id} className="card flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{t.from_city}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{t.to_city}</span>
                <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
              </div>
              <p className="text-sm text-gray-500">📅 {t.start}{t.end ? ` → ${t.end}` : ''}</p>
              {t.notes && <p className="text-sm text-gray-400 mt-0.5">{t.notes}</p>}
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className="font-semibold">{t.budget} €</p>
              {t.spent > 0 && <p className={`text-xs ${t.spent > t.budget ? 'text-red-500' : 'text-green-600'}`}>{t.spent} € dépensés</p>}
              <button className="btn-danger text-xs" onClick={() => handleDelete(t.id)}>Supprimer</button>
            </div>
          </div>
        ))}
        {trips.length === 0 && <p className="text-gray-400 text-center py-8">Aucun voyage. Cliquez sur "Ajouter" !</p>}
      </div>
    </div>
  )
}
