import { useState } from 'react';
import type { CardResolution, Deck, PrintingVariant } from '../types/card';
import CardRow from './CardRow';
import PrintingModal from './PrintingModal';
import PrintLayout from './PrintLayout';
import './CardImportResults.css';

interface CardImportResultsProps {
  deck: Deck;
  onReset: () => void;
  onProceed?: (deck: Deck) => void;
}

function CardImportResults({ deck, onReset }: CardImportResultsProps) {
  const [selectedCard, setSelectedCard] = useState<CardResolution | null>(null);
  const [printingSelections, setPrintingSelections] = useState<Map<string, PrintingVariant>>(new Map());
  const [showPrintLayout, setShowPrintLayout] = useState(false);

  const resolved = deck.cards.filter((c) => c.resolved);
  const unresolved = deck.cards.filter((c) => !c.resolved);
  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
  const resolvedCount = resolved.reduce((sum, c) => sum + c.quantity, 0);

  const handleCardClick = (card: CardResolution) => {
    setSelectedCard(card);
  };

  const handlePrintingSelect = (printing: PrintingVariant) => {
    if (!selectedCard || !selectedCard.card) return;

    const cardId = selectedCard.card.scryId || selectedCard.card.id;
    setPrintingSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(cardId, printing);
      return newMap;
    });

    // Update the card's image in the deck
    const updatedCards = deck.cards.map(card => {
      if (card.card && (card.card.scryId || card.card.id) === cardId) {
        return {
          ...card,
          card: {
            ...card.card,
            imageUrl: printing.imageUrl,
          },
        };
      }
      return card;
    });

    deck.cards = updatedCards;
  };

  const getDisplayCard = (card: CardResolution): CardResolution => {
    if (!card.card) return card;
    const cardId = card.card.scryId || card.card.id;
    const selectedPrinting = printingSelections.get(cardId);
    if (selectedPrinting) {
      return {
        ...card,
        card: {
          ...card.card,
          imageUrl: selectedPrinting.imageUrl,
        },
      };
    }
    return card;
  };

  return showPrintLayout ? (
    <PrintLayout 
      deck={deck} 
      printingSelections={printingSelections}
      onBack={() => setShowPrintLayout(false)} 
    />
  ) : (
    <div className="import-results">
      <div className="results-header">
        <div className="header-content">
          <h1>Select Card Printings</h1>
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
        </div>
      </div>

      {resolved.length > 0 && (
        <section className="results-section">
          <h2>Resolved Cards ({resolved.length})</h2>
          <p className="results-hint">Click on any card to change its printing</p>
          <div className="card-list">
            {resolved.map((card, idx) => (
              <CardRow
                key={`${card.originalName}-${idx}`}
                cardResolution={getDisplayCard(card)}
                onCardClick={handleCardClick}
              />
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

      <div className="results-footer">
        <div className="footer-content">
          <p className="selection-summary">
            Ready to print · {resolved.length} unique cards · {resolvedCount} total
          </p>
          <button className="print-button" onClick={() => setShowPrintLayout(true)}>
            Print →
          </button>
        </div>
      </div>

      {selectedCard && selectedCard.card && (
        <PrintingModal
          cardName={selectedCard.card.name}
          currentImageUrl={selectedCard.card.imageUrl}
          onSelect={handlePrintingSelect}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}

export default CardImportResults;
