import { useEffect, useRef } from 'react';
import type { PrintPage } from '../services/printLayoutService';
import { generatePageCanvas } from '../services/printLayoutService';
import { PRINTER_CONFIG } from '../config/printerConfig';
import './PrintPreview.css';

interface PrintPreviewProps {
  page: PrintPage;
  pageNumber: number;
  totalPages: number;
  dpi: number;
  onPageChange: (index: number) => void;
}

export default function PrintPreview({
  page,
  pageNumber,
  totalPages,
  dpi,
}: PrintPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !page) return;

    generatePageCanvas(page, dpi).then((canvas) => {
      if (canvasRef.current) {
        // Copy canvas content
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    });
  }, [page, dpi]);

  if (!page) {
    return (
      <div className="print-preview">
        <div className="preview-label">
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="print-preview">
      <div className="preview-label">
        <span>Vista previa de página A4 @ {dpi} DPI</span>
      </div>
      <div className="preview-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          style={{
            // Scale down canvas for display (maintain aspect ratio of A4)
            width: '100%',
            height: 'auto',
            display: 'block',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
          }}
        />
      </div>
      <div className="preview-info">
        <p>
          Página {pageNumber} de {totalPages} • {page.cards.length} cartas • {PRINTER_CONFIG.card.width_mm} ×{' '}
          {PRINTER_CONFIG.card.height_mm} mm c/u
        </p>
      </div>
    </div>
  );
}
