import { useRef, useEffect } from 'react';
import { PRINTER_CONFIG, getCardPixels } from '../config/printerConfig';
import './CalibrationPage.css';

interface CalibrationPageProps {
  onClose: () => void;
}

export default function CalibrationPage({ onClose }: CalibrationPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpi = PRINTER_CONFIG.dpi;
    const cardPixels = getCardPixels(dpi);

    // Set canvas to A4 dimensions
    canvas.width = Math.round((210 / 25.4) * dpi);
    canvas.height = Math.round((297 / 25.4) * dpi);

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the calibration rectangle
    const x = (canvas.width - cardPixels.width) / 2;
    const y = (canvas.height - cardPixels.height) / 2;

    // Draw rectangle for card dimensions
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.round(dpi / 300); // ~2px at 600 DPI
    ctx.strokeRect(x, y, cardPixels.width, cardPixels.height);

    // Draw corner markers
    const markerSize = Math.round(dpi / 60); // ~10px at 600 DPI
    ctx.fillStyle = '#000000';

    // Top-left
    ctx.fillRect(x, y, markerSize, markerSize);
    ctx.fillRect(x, y, markerSize, markerSize);

    // Top-right
    ctx.fillRect(x + cardPixels.width - markerSize, y, markerSize, markerSize);
    ctx.fillRect(x + cardPixels.width - markerSize, y, markerSize, markerSize);

    // Bottom-left
    ctx.fillRect(x, y + cardPixels.height - markerSize, markerSize, markerSize);
    ctx.fillRect(x, y + cardPixels.height - markerSize, markerSize, markerSize);

    // Bottom-right
    ctx.fillRect(x + cardPixels.width - markerSize, y + cardPixels.height - markerSize, markerSize, markerSize);
    ctx.fillRect(x + cardPixels.width - markerSize, y + cardPixels.height - markerSize, markerSize, markerSize);

    // Add text label
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.round(dpi / 25)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('63.5 × 88.9 mm', canvas.width / 2, y - Math.round(dpi / 50));
  }, []);

  return (
    <div className="calibration-page">
      <div className="calibration-header">
        <h2>📏 Página de Calibración</h2>
        <button className="close-button" onClick={onClose}>
          ✕ Cerrar
        </button>
      </div>

      <div className="calibration-instructions">
        <p>
          Esta página contiene un rectángulo con las dimensiones exactas de una carta MTG:{' '}
          <strong>63.5 × 88.9 mm</strong>
        </p>
        <p>
          <strong>Instrucciones:</strong>
        </p>
        <ol>
          <li>Imprime esta página al <strong>100 %</strong> (sin escalado)</li>
          <li>Mide físicamente el rectángulo impreso</li>
          <li>Debe medir exactamente 63.5 × 88.9 mm</li>
          <li>Si no coincide, ajusta los márgenes o la escala de tu impresora</li>
        </ol>
      </div>

      <div className="calibration-canvas-container">
        <canvas
          ref={canvasRef}
          className="calibration-canvas"
          style={{
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
          }}
        />
      </div>

      <div className="calibration-actions">
        <button onClick={() => window.print()} className="print-button">
          🖨️ IMPRIMIR PÁGINA DE CALIBRACIÓN
        </button>
      </div>
    </div>
  );
}
