import { useState } from 'react';
import type { DeckCard, PrintingVariant } from '../types/card';
import { usePrintings, useLazyImage } from '../hooks/usePrinting';
import './PrintingSelector.css';

interface PrintingSelectorProps {
  deckCard: DeckCard;
  onSelectionChange: (deckCard: DeckCard, printing: PrintingVariant) => void;
}

function PrintingSelector({ deckCard, onSelectionChange }: PrintingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { printings, loading, error } = usePrintings(deckCard.name, deckCard.scryId);
  const { ref: imgRef, imageSrc, isLoading } = useLazyImage(
    deckCard.printingSelection.imageUrl
  );

  const handlePrintingSelect = (printing: PrintingVariant) => {
    onSelectionChange(deckCard, printing);
    setIsOpen(false);
  };

  return (
    <div className="printing-selector">
      {/* Card image with lazy loading */}
      <div className="card-image-wrapper">
        {deckCard.printingSelection.imageUrl ? (
          <>
            {isLoading && <div className="image-placeholder">Loading...</div>}
            <img
              ref={imgRef}
              src={imageSrc || deckCard.printingSelection.imageUrl}
              alt={deckCard.name}
              className="card-image"
              onLoad={() => {
                // Image loaded
              }}
            />
          </>
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
        <div className="card-quantity">{deckCard.quantity}x</div>
      </div>

      {/* Card info and selector */}
      <div className="printing-info">
        <div className="card-name">{deckCard.name}</div>

        <div className="current-printing">
          <span className="set-code">{deckCard.printingSelection.setCode}</span>
          {deckCard.printingSelection.setName && (
            <span className="set-name">{deckCard.printingSelection.setName}</span>
          )}
        </div>

        {/* Printing selector button and dropdown */}
        <button
          className="printing-toggle"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || printings.length === 0}
          title={printings.length > 0 ? `${printings.length} printings available` : 'No printings available'}
        >
          {loading ? 'Loading printings...' : `${printings.length} printing${printings.length !== 1 ? 's' : ''}`}
        </button>

        {error && <div className="printing-error">{error}</div>}

        {isOpen && printings.length > 0 && (
          <div className="printing-dropdown">
            {printings.map((printing) => (
              <button
                key={`${printing.setCode}-${printing.id}`}
                className={`printing-option ${
                  deckCard.printingSelection.setCode === printing.setCode
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handlePrintingSelect(printing)}
              >
                <span className="option-set">{printing.setCode}</span>
                <span className="option-name">{printing.setName}</span>
                {printing.artistName && (
                  <span className="option-artist">by {printing.artistName}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrintingSelector;
