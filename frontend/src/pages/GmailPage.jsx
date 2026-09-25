import { useState, useEffect } from 'react'
import { getGmailStatus, scanGmail, connectGmail } from '../services/api'
import { createTrip } from '../services/api'

export default function GmailPage({ onTripsImported }) {
  const [connected, setConnected] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState([])
  const [imported, setImported] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    checkStatus()
    // Check if coming back from OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail') === 'connected') {
      setConnected(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const checkStatus = async () => {
    try {
      const res = await getGmailStatus()
      setConnected(res.data.connected)
    } catch (e) {}
  }

  const handleScan = async () => {
    setScanning(true)
    setError('')
    setResults([])
    try {
      const res = await scanGmail()
      setResults(res.data.trips || [])
      if (!res.data.trips?.length) setError('Aucun email de voyage trouvé dans les 2 dernières années.')
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du scan Gmail.')
    } finally { setScanning(false) }
  }

  const handleImport = async (trip) => {
    try {
      await createTrip({
        from_city: trip.from || '',
        to_city: trip.to || '',
        start: trip.start || new Date().toISOString().split('T')[0],
        end: trip.end || null,
        budget: trip.budget || 0,
        status: 'upcoming',
        notes: `${trip.notes || ''} [importé depuis Gmail: ${trip.email_subject || ''}]`.trim(),
        expenses: [],
      })
      setImported(prev => [...prev, trip.email_subject])
      onTripsImported()
    } catch (e) {
      alert('Erreur lors de l\'import.')
    }
  }

  return (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-medium">Connexion Gmail</h2>
            <p className="text-sm text-gray-400 mt-0.5">Détection automatique des confirmations de voyage</p>
          </div>
          <div className={`badge ${connected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {connected ? '✓ Connecté' : 'Non connecté'}
          </div>
        </div>

        {!connected ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Connectez votre Gmail pour détecter automatiquement les emails de confirmation de vol, hôtel, train et autres réservations.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700 font-medium mb-1">Avant de connecter :</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                <li>Créez un projet sur <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a></li>
                <li>Activez l'API Gmail</li>
                <li>Créez des credentials OAuth2 (type : application web)</li>
                <li>Ajoutez <code>http://localhost:8000/api/gmail/callback</code> comme URI de redirection</li>
                <li>Téléchargez <code>client_secret.json</code> dans le dossier <code>backend/</code></li>
              </ol>
            </div>
            <button className="btn-primary" onClick={connectGmail}>
              📧 Connecter Gmail
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Gmail est connecté. Lancez le scan pour détecter vos emails de voyage des 2 dernières années.
            </p>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={handleScan} disabled={scanning}>
                {scanning ? '🔍 Scan en cours...' : '🔍 Scanner mes emails'}
              </button>
              <button className="btn" onClick={() => { setConnected(false); setResults([]) }}>
                Déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {scanning && (
        <div className="card text-center py-8">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-gray-500 text-sm">Analyse de vos emails en cours...</p>
          <p className="text-gray-400 text-xs mt-1">L'IA extrait les informations de voyage</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-3">{results.length} voyage{results.length > 1 ? 's' : ''} détecté{results.length > 1 ? 's' : ''}</h3>
          <div className="space-y-3">
            {results.map((r, i) => {
              const isImported = imported.includes(r.email_subject)
              return (
                <div key={i} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{r.from || '?'}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">{r.to || '?'}</span>
                        <span className={`badge ${r.type === 'vol' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {r.type || 'voyage'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">📅 {r.start}{r.end ? ` → ${r.end}` : ''}</p>
                      {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
                      <p className="text-xs text-gray-300 mt-1 italic truncate max-w-xs">📧 {r.email_subject}</p>
                    </div>
                    <button
                      className={isImported ? 'badge bg-green-50 text-green-700' : 'btn-primary text-xs'}
                      onClick={() => !isImported && handleImport(r)}
                      disabled={isImported}
                    >
                      {isImported ? '✓ Importé' : '+ Importer'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
