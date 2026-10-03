import type { CardResolution } from '../types/card';
import './CardRow.css';

interface CardRowProps {
  cardResolution: CardResolution;
}

function CardRow({ cardResolution }: CardRowProps) {
  const { originalName, quantity, resolved, card, error } = cardResolution;

  return (
    <div className={`card-row ${resolved ? 'resolved' : 'unresolved'}`}>
      <div className="card-image-container">
        {card?.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="card-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>

      <div className="card-info">
        <div className="card-header">
          <span className="quantity">{quantity}x</span>
          <span className="card-name">{card?.name || originalName}</span>
          <span className={`status ${resolved ? 'resolved' : 'unresolved'}`}>
            {resolved ? '✓' : '✗'}
          </span>
        </div>

        {error && <div className="card-error">{error}</div>}

        {card && card.scryId && (
          <div className="card-meta">
            <span className="card-id">{card.scryId.substring(0, 8)}...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardRow;
