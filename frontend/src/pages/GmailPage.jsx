import { useState, useEffect } from 'react'
import { getGmailStatus, getGmailAuth, scanGmail } from '../services/api'
import { createTrip } from '../services/api'
import { useSearchParams } from 'react-router-dom'

export default function GmailPage() {
  const [connected, setConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState([])
  const [added, setAdded] = useState([])
  const [searchParams] = useSearchParams()

  useEffect(() => {
    getGmailStatus().then(s => setConnected(s?.connected || false)).catch(() => setConnected(false))
    if (searchParams.get('connected') === 'true') setConnected(true)
  }, [])

  const connect = async () => {
    const { auth_url } = await getGmailAuth()
    window.location.href = auth_url
  }

  const scan = async () => {
    setScanning(true)
    setResults([])
    try {
      const data = await scanGmail()
      setResults(data.detected || [])
    } catch {
      alert('Erreur lors du scan Gmail')
    } finally {
      setScanning(false)
    }
  }

  const importTrip = async (trip) => {
    await createTrip({ ...trip, budget: 0, spent: 0, status: 'upcoming', expenses: [] })
    setAdded(prev => [...prev, trip])
  }

  const isAdded = (trip) => added.some(a => a.from_city === trip.from_city && a.to_city === trip.to_city && a.start === trip.start)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📧 Détection Gmail</h1>
      <p className="text-gray-500 mb-6">Connectez votre Gmail pour détecter automatiquement vos confirmations de voyage</p>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="font-medium">{connected ? 'Gmail connecté' : 'Gmail non connecté'}</span>
          {!connected && (
            <button onClick={connect} className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              🔗 Connecter Gmail
            </button>
          )}
          {connected && (
            <button onClick={scan} disabled={scanning} className="ml-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm disabled:opacity-50">
              {scanning ? '⏳ Scan en cours…' : '🔍 Scanner mes emails'}
            </button>
          )}
        </div>

        {!connected && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Comment ça fonctionne :</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-600">
              <li>Cliquez sur "Connecter Gmail" et autorisez l'accès</li>
              <li>Cliquez sur "Scanner mes emails" pour détecter vos confirmations</li>
              <li>Importez les voyages détectés en un clic</li>
            </ol>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">🎯 {results.length} voyage(s) détecté(s)</h2>
          <div className="space-y-3">
            {results.map((trip, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{trip.from_city} → {trip.to_city}</h3>
                  <p className="text-sm text-gray-500">{trip.start}{trip.end ? ` → ${trip.end}` : ''}</p>
                  {trip.notes && <p className="text-xs text-gray-400 italic mt-1">{trip.notes}</p>}
                </div>
                <button
                  onClick={() => importTrip(trip)}
                  disabled={isAdded(trip)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    isAdded(trip) ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAdded(trip) ? '✅ Importé' : '+ Importer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {connected && !scanning && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Cliquez sur "Scanner mes emails" pour chercher vos confirmations de voyage</p>
        </div>
      )}
    </div>
  )
}
