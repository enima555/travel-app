import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function BudgetPage({ trips }) {
  const [selectedId, setSelectedId] = useState(trips[0]?.id || null)
  const trip = trips.find(t => t.id === selectedId) || trips[0]

  const overviewData = trips.map(t => ({
    name: `${t.from_city}→${t.to_city}`,
    Budget: t.budget,
    Dépensé: t.spent,
  }))

  if (!trip) return <p className="text-gray-400 text-center py-8">Aucun voyage enregistré.</p>

  const pct = trip.budget ? Math.min(100, Math.round((trip.spent / trip.budget) * 100)) : 0
  const over = trip.spent > trip.budget

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-medium mb-4">Vue d'ensemble des budgets</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={overviewData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v} €`} />
            <Bar dataKey="Budget" fill="#dbeafe" radius={[4,4,0,0]} />
            <Bar dataKey="Dépensé" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Détail par voyage</h2>
          <select className="input" style={{width:'auto'}} value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>
            {trips.map(t => <option key={t.id} value={t.id}>{t.from_city} → {t.to_city}</option>)}
          </select>
        </div>

        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Budget prévu</span><span className="font-medium text-gray-900">{trip.budget} €</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-3">
          <span>Dépensé</span><span className={`font-medium ${over ? 'text-red-600' : 'text-green-600'}`}>{trip.spent} €</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
          <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-blue-500'}`} style={{width:`${pct}%`}} />
        </div>
        <p className="text-xs text-gray-400 text-right mb-4">{pct}% utilisé</p>

        {trip.expenses?.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              {trip.expenses.map((e, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
                  <span className="text-gray-500">{e.cat}</span>
                  <span className="font-medium">{e.amount} €</span>
                </div>
              ))}
            </div>
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={trip.expenses.map(e=>({name:e.cat,value:e.amount}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name})=>name}>
                    {trip.expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} €`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {!trip.expenses?.length && <p className="text-gray-400 text-sm text-center py-4">Aucune dépense enregistrée pour ce voyage.</p>}
      </div>
    </div>
  )
}
