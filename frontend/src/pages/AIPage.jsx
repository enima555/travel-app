import { useState } from 'react'
import { chatAI, detectTrip, createTrip } from '../services/api'

const QUICK = [
  'Résume mes voyages et donne des statistiques',
  'Quel est mon voyage le plus cher ?',
  'Quelles destinations me recommandes-tu ?',
  'Quel budget prévoir pour Tokyo 7 jours ?',
  'Quels documents pour voyager en Europe depuis l\'Algérie ?',
]

export default function AIPage({ trips }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Bonjour ! Je suis votre assistant voyage. Vous avez ${trips.length} voyage(s) enregistré(s). Posez-moi n'importe quelle question !` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [detectText, setDetectText] = useState('')
  const [detectResult, setDetectResult] = useState(null)
  const [detectLoading, setDetectLoading] = useState(false)
  const [detectError, setDetectError] = useState('')

  const send = async (q) => {
    const question = q || input.trim()
    if (!question) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await chatAI(question)
      setMessages(m => [...m, { role: 'ai', text: res.data.reply }])
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: '⚠️ Erreur : vérifiez que ANTHROPIC_API_KEY est configurée dans le backend.' }])
    } finally { setLoading(false) }
  }

  const handleDetect = async () => {
    if (!detectText.trim()) return
    setDetectLoading(true)
    setDetectResult(null)
    setDetectError('')
    try {
      const res = await detectTrip(detectText)
      setDetectResult(res.data)
    } catch (e) {
      setDetectError(e.response?.data?.detail || 'Aucun voyage détecté.')
    } finally { setDetectLoading(false) }
  }

  const handleSaveDetected = async () => {
    if (!detectResult) return
    await createTrip({
      from_city: detectResult.from || '',
      to_city: detectResult.to || '',
      start: detectResult.start || new Date().toISOString().split('T')[0],
      end: detectResult.end || null,
      budget: detectResult.budget || 0,
      status: 'upcoming',
      notes: detectResult.notes || '',
      expenses: [],
    })
    setDetectResult(null)
    setDetectText('')
    alert('Voyage enregistré !')
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Chat */}
      <div className="card flex flex-col" style={{minHeight:'450px'}}>
        <h2 className="font-medium mb-3">Assistant IA</h2>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3" style={{maxHeight:'320px'}}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-400">Réflexion...</div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-2">
          <input className="input flex-1 text-sm" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()} placeholder="Posez une question..." />
          <button className="btn-primary" onClick={() => send()}>Envoyer</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK.map((q, i) => (
            <button key={i} className="text-xs px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer" onClick={() => send(q)}>
              {q.length > 30 ? q.slice(0, 30) + '…' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Detect */}
      <div className="card">
        <h2 className="font-medium mb-2">Détection de texte</h2>
        <p className="text-xs text-gray-400 mb-3">Collez un email, SMS ou itinéraire — l'IA extrait les infos automatiquement.</p>
        <textarea
          className="input mb-2"
          rows={5}
          style={{resize:'vertical'}}
          value={detectText}
          onChange={e => setDetectText(e.target.value)}
          placeholder="Ex: Vol Air Algérie AH1020 Alger → Paris CDG le 20 août, départ 10h30, arrivée 13h45. Hôtel ibis Paris du 20 au 25 août..."
        />
        <button className="btn-primary mb-3" onClick={handleDetect} disabled={detectLoading}>
          {detectLoading ? '🔍 Analyse...' : '🔍 Analyser'}
        </button>

        {detectError && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mb-3">{detectError}</div>}

        {detectResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium mb-2">✓ Voyage détecté</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{detectResult.from}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-sm">{detectResult.to}</span>
            </div>
            <p className="text-xs text-gray-600">📅 {detectResult.start}{detectResult.end ? ` → ${detectResult.end}` : ''}</p>
            {detectResult.notes && <p className="text-xs text-gray-500 mt-0.5">{detectResult.notes}</p>}
            <button className="btn-primary mt-3 text-xs" onClick={handleSaveDetected}>Enregistrer ce voyage</button>
          </div>
        )}
      </div>
    </div>
  )
}
