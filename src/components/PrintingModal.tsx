import { useEffect, useState } from 'react';
import type { PrintingVariant } from '../types/card';
import { getCardPrintings } from '../services/mtgApi';
import { LoadingCard } from './Loader';
import './PrintingModal.css';

interface PrintingModalProps {
  cardName: string;
  currentImageUrl?: string;
  onSelect: (printing: PrintingVariant) => void;
  onClose: () => void;
}

function PrintingModal({ cardName, currentImageUrl, onSelect, onClose }: PrintingModalProps) {
  const [printings, setPrintings] = useState<PrintingVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadPrintings = async () => {
      try {
        setLoading(true);
        const data = await getCardPrintings(cardName);
        setPrintings(data);
        
        // Find the current printing if we have currentImageUrl
        if (currentImageUrl && data.length > 0) {
          const currentIdx = data.findIndex(p => p.imageUrl === currentImageUrl);
          if (currentIdx >= 0) {
            setCurrentIndex(currentIdx);
          }
        }
      } catch (err) {
        setError('Failed to load printings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPrintings();
  }, [cardName, currentImageUrl]);

  if (loading) {
    return (
      <div className="printing-modal-overlay" onClick={onClose}>
        <div className="printing-modal-container" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (error || printings.length === 0) {
    return (
      <div className="printing-modal-overlay" onClick={onClose}>
        <div className="printing-modal-container" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <div className="modal-error">
            <p>{error || 'No printings available'}</p>
            <button className="modal-button-close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const current = printings[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? printings.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === printings.length - 1 ? 0 : prev + 1));
  };

  const handleSelect = () => {
    onSelect(current);
    onClose();
  };

  return (
    <div className="printing-modal-overlay" onClick={onClose}>
      <div className="printing-modal-container" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-content">
          <div className="carousel">
            <button className="carousel-button prev" onClick={handlePrevious}>
              ‹
            </button>

            <div className="carousel-image-wrapper">
              {current.imageUrl ? (
                <img
                  src={current.imageUrl}
                  alt={`${cardName} - ${current.setCode}`}
                  className="carousel-image"
                  loading="eager"
                />
              ) : (
                <div className="carousel-placeholder">No Image</div>
              )}
            </div>

            <button className="carousel-button next" onClick={handleNext}>
              ›
            </button>
          </div>

          <div className="modal-info">
            <h2>{cardName}</h2>
            <div className="printing-details">
              <p>
                <strong>Set:</strong> {current.setName || current.setCode}
              </p>
              <p>
                <strong>Code:</strong> {current.setCode}
              </p>
              {current.artistName && (
                <p>
                  <strong>Artist:</strong> {current.artistName}
                </p>
              )}
              {current.releaseDate && (
                <p>
                  <strong>Released:</strong> {new Date(current.releaseDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="carousel-counter">
              {currentIndex + 1} / {printings.length}
            </div>

            <button className="modal-select-button" onClick={handleSelect}>
              Select This Printing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintingModal;
