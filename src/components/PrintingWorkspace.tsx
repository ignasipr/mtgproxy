import { useEffect, useState, useCallback } from 'react';
import type { CardResolution, DeckCard, PrintingVariant, PrintingSelection } from '../types/card';
import PrintingSelector from './PrintingSelector';
import './PrintingWorkspace.css';

interface PrintingWorkspaceProps {
  resolvedCards: CardResolution[];
  deckName?: string;
  onBack: () => void;
  selectionsCache: Map<string, PrintingSelection>;
}

function PrintingWorkspace({ resolvedCards, deckName, onBack, selectionsCache }: PrintingWorkspaceProps) {
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);

  const initializeDeckCards = useCallback(async () => {
    const newDeckCards: DeckCard[] = [];

    for (const resolution of resolvedCards) {
      if (!resolution.resolved || !resolution.card) continue;

      const scryId = resolution.card.scryId || resolution.card.id;
      const cachedSelection = selectionsCache.get(scryId);

      const deckCard: DeckCard = {
        name: resolution.card.name,
        quantity: resolution.quantity,
        scryId,
        originalCard: resolution.card,
        printingSelection: cachedSelection || {
          id: `${scryId}-default`,
          setCode: 'DEFAULT',
          imageUrl: resolution.card.imageUrl,
          scryId,
        },
      };

      newDeckCards.push(deckCard);
    }

    setDeckCards(newDeckCards);
  }, [resolvedCards, selectionsCache]);

  useEffect(() => {
    initializeDeckCards();
  }, [initializeDeckCards]);

  const handlePrintingChange = useCallback(
    (deckCard: DeckCard, printing: PrintingVariant) => {
      const newSelection: PrintingSelection = {
        id: `${deckCard.scryId}-${printing.setCode}`,
        setCode: printing.setCode,
        setName: printing.setName,
        imageUrl: printing.imageUrl,
        variantId: printing.id,
        scryId: deckCard.scryId,
      };

      // Update session cache
      selectionsCache.set(deckCard.scryId, newSelection);

      // Update deck cards
      setDeckCards((prev) =>
        prev.map((card) =>
          card.scryId === deckCard.scryId
            ? { ...card, printingSelection: newSelection }
            : card
        )
      );
    },
    [selectionsCache]
  );

  return (
    <div className="printing-workspace">
      <div className="workspace-header">
        <div className="header-content">
          <h1>Select Printings</h1>
          {deckName && <p className="deck-name">{deckName}</p>}
          <p className="deck-info">
            {deckCards.length} cards · {deckCards.reduce((sum, c) => sum + c.quantity, 0)} total
          </p>
        </div>
        <button className="back-button" onClick={onBack}>
          ← Back to Import
        </button>
      </div>

      <div className="printing-list">
        {deckCards.length === 0 ? (
          <div className="empty-state">
            <p>No valid cards to display</p>
          </div>
        ) : (
          <>
            {deckCards.map((deckCard) => (
              <PrintingSelector
                key={deckCard.scryId}
                deckCard={deckCard}
                onSelectionChange={handlePrintingChange}
              />
            ))}
          </>
        )}
      </div>

      <div className="workspace-footer">
        <div className="footer-content">
          <p className="selection-summary">
            Selections cached for this session · Ready to proceed to printing
          </p>
          <button className="next-button">
            Continue to Printing →
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintingWorkspace;
