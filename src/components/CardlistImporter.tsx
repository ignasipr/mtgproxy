import { useState, useRef } from 'react'
import { parseCardlist } from '../services/cardlistParser';
import { searchCardExact, searchCard } from '../services/mtgApi';
import type { CardResolution, Deck, PrintingSelection } from '../types/card'
import CardImportResults from './CardImportResults';
import PrintingWorkspace from './PrintingWorkspace'
import { Loader } from './Loader'
import './CardlistImporter.css'

type Screen = 'import' | 'results' | 'workspace'

function CardlistImporter() {
  const [input, setInput] = useState('')
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [screen, setScreen] = useState<Screen>('import')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  // Session-level cache for printing selections
  const selectionsCache = useRef<Map<string, PrintingSelection>>(new Map())

  const handleImport = async () => {
    if (!input.trim()) {
      setError('Please paste a cardlist')
      return
    }

    setError('')
    setLoading(true)
    setDeck(null)

    try {
      const parsed = parseCardlist(input)

      if (parsed.length === 0) {
        setError('No cards found in the pasted list')
        setLoading(false)
        return
      }

      // Resolve each card against MTG API
      const resolutions: CardResolution[] = []
      const total = parsed.length
      setProgress({ current: 0, total })

      for (let i = 0; i < parsed.length; i++) {
        const { name, quantity } = parsed[i]
        let resolved = false
        let card = null
        let resolveError = ''

        // Try exact match first
        const exactMatch = await searchCardExact(name)
        if (exactMatch) {
          resolved = true
          card = {
            ...exactMatch,
            quantity,
          }
        } else {
          // Fall back to fuzzy search
          const fuzzyMatch = await searchCard(name)
          if (fuzzyMatch) {
            resolved = true
            card = {
              ...fuzzyMatch,
              quantity,
            }
          } else {
            resolveError = `Card not found in Scryfall database`
          }
        }

        resolutions.push({
          originalName: name,
          quantity,
          resolved,
          card: card || undefined,
          error: resolveError || undefined,
        })

        setProgress({ current: i + 1, total })
      }

      const newDeck: Deck = {
        cards: resolutions,
        timestamp: Date.now(),
        name: 'Imported Deck',
      }

      setDeck(newDeck)
      setScreen('results')
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setDeck(null)
    setError('')
    setScreen('import')
  }

  const handleProceedToWorkspace = (workingDeck: Deck) => {
    setDeck(workingDeck)
    setScreen('workspace')
  }

  if (screen === 'workspace' && deck) {
    return (
      <PrintingWorkspace
        resolvedCards={deck.cards}
        deckName={deck.name}
        onBack={() => setScreen('results')}
        selectionsCache={selectionsCache.current}
      />
    )
  }

  if (screen === 'results' && deck) {
    return (
      <CardImportResults
        deck={deck}
        onReset={handleClear}
        onProceed={handleProceedToWorkspace}
      />
    )
  }

  return (
    <div className="cardlist-importer">
      <div className="importer-container">
        <h1>Import MTG Cardlist</h1>
        <p className="description">
          Paste your decklist below. Supported formats: "1 Sol Ring", "Lightning Bolt", etc.
        </p>

        <textarea
          className="cardlist-textarea"
          placeholder="1 Sol Ring&#10;4 Lightning Bolt&#10;..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading-section">
            <Loader
              size="medium"
              variant="spinner"
              label={`Resolving cards... ${progress.current}/${progress.total}`}
            />
          </div>
        )}

        <div className="button-group">
          <button
            className="import-button"
            onClick={handleImport}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Resolving cards...' : 'Import Deck'}
          </button>
          <button className="clear-button" onClick={handleClear} disabled={loading}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardlistImporter
