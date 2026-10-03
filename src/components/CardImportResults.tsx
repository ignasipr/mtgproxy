import type { Deck } from '../types/card';
import CardRow from './CardRow';
import './CardImportResults.css';

interface CardImportResultsProps {
  deck: Deck;
  onReset: () => void;
  onProceed: (deck: Deck) => void;
}

function CardImportResults({ deck, onReset, onProceed }: CardImportResultsProps) {
  const resolved = deck.cards.filter((c) => c.resolved);
  const unresolved = deck.cards.filter((c) => !c.resolved);
  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
  const resolvedCount = resolved.reduce((sum, c) => sum + c.quantity, 0);

  const handleProceed = () => {
    if (resolved.length > 0) {
      // Create a deck with only resolved cards for the workspace
      const workingDeck: Deck = {
        ...deck,
        cards: resolved,
      };
      onProceed(workingDeck);
    }
  };

  return (
    <div className="import-results">
      <div className="results-header">
        <div className="header-content">
          <h1>Deck Import Results</h1>
          <div className="stats">
            <span className="stat">
              <strong>{resolvedCount}</strong> / <strong>{totalCards}</strong> cards resolved
            </span>
            <span className="stat">
              <strong>{resolved.length}</strong> unique cards
            </span>
          </div>
        </div>
        <div className="header-buttons">
          <button className="back-button" onClick={onReset}>
            ← Back to Import
          </button>
          {resolved.length > 0 && (
            <button className="proceed-button" onClick={handleProceed}>
              Continue to Printings →
            </button>
          )}
        </div>
      </div>

      {resolved.length > 0 && (
        <section className="results-section">
          <h2>Resolved Cards ({resolved.length})</h2>
          <div className="card-list">
            {resolved.map((card, idx) => (
              <CardRow key={`${card.originalName}-${idx}`} cardResolution={card} />
            ))}
          </div>
        </section>
      )}

      {unresolved.length > 0 && (
        <section className="results-section unresolved-section">
          <h2>Unresolved Cards ({unresolved.length})</h2>
          <div className="card-list">
            {unresolved.map((card, idx) => (
              <CardRow key={`${card.originalName}-${idx}`} cardResolution={card} />
            ))}
          </div>
        </section>
      )}

      {resolved.length === 0 && unresolved.length === 0 && (
        <div className="empty-state">
          <p>No cards to display</p>
        </div>
      )}
    </div>
  );
}

export default CardImportResults;
