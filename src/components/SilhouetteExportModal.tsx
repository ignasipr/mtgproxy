import { useState, useRef } from 'react';
import type { PrintPage } from '../services/printLayoutService';
import { generateCutPathSVG, generateCutPathMetadata, downloadSVG, downloadMetadata, DEFAULT_SILHOUETTE_CONFIG, type SilhouetteConfig } from '../services/silhouetteExportService';
import './SilhouetteExportModal.css';

interface SilhouetteExportModalProps {
  pages: PrintPage[];
  dpi: number;
  onClose: () => void;
}

export default function SilhouetteExportModal({ pages, dpi, onClose }: SilhouetteExportModalProps) {
  const [config, setConfig] = useState<SilhouetteConfig>(DEFAULT_SILHOUETTE_CONFIG);
  const [isExporting, setIsExporting] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCornerRadiusChange = (value: number) => {
    setConfig(prev => ({ ...prev, cornerRadius_mm: value }));
  };

  const handleRegistrationMarginChange = (value: number) => {
    setConfig(prev => ({ ...prev, registrationMarginMm: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Generate SVG cut paths
      const svgContent = generateCutPathSVG(pages, config, dpi);

      // Generate metadata
      const cutPaths = generateCutPathMetadata(pages, config, dpi);
      const metadata = {
        timestamp: new Date().toISOString(),
        pageCount: pages.length,
        cardsTotal: pages.reduce((sum, p) => sum + p.cards.length, 0),
        dpi,
        config,
        cutPaths,
      };

      // Download files
      downloadSVG(svgContent, 'silhouette_cut_paths.svg');
      downloadMetadata(metadata, 'silhouette_metadata.json');

      // Notify user
      alert('✅ Files ready for Silhouette Studio:\n- silhouette_cut_paths.svg\n- silhouette_metadata.json\n\nOpen the SVG file in Silhouette Studio Designer Edition or higher.');
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const totalCards = pages.reduce((sum, p) => sum + p.cards.length, 0);

  return (
    <div className="silhouette-modal-overlay">
      <div className="silhouette-modal">
        <div className="silhouette-header">
          <h2>Preparar para Silhouette CAMEO 5α</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="silhouette-content">
          <div className="silhouette-info">
            <p>
              Exporta los archivos necesarios para completar el corte en tu CAMEO 5α.
              Se generarán líneas de corte con esquinas redondeadas configurables.
            </p>
            <div className="info-stats">
              <span><strong>{pages.length}</strong> página(s)</span>
              <span><strong>{totalCards}</strong> cartas</span>
              <span><strong>{dpi}</strong> ppp</span>
            </div>
          </div>

          <div className="silhouette-config">
            <div className="config-group">
              <label htmlFor="corner-radius">Radio de esquinas (mm):</label>
              <div className="slider-group">
                <input
                  id="corner-radius"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={config.cornerRadius_mm}
                  onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
                  disabled={isExporting}
                />
                <span className="value-display">{config.cornerRadius_mm} mm</span>
              </div>
              <small>Controla la redondez de las esquinas de corte. 3 mm es el recomendado.</small>
            </div>

            <div className="config-group">
              <label htmlFor="reg-margin">Margen de registro (mm):</label>
              <div className="slider-group">
                <input
                  id="reg-margin"
                  type="range"
                  min="3"
                  max="15"
                  step="0.5"
                  value={config.registrationMarginMm}
                  onChange={(e) => handleRegistrationMarginChange(Number(e.target.value))}
                  disabled={isExporting}
                />
                <span className="value-display">{config.registrationMarginMm} mm</span>
              </div>
              <small>Zona segura alrededor de la página para las marcas de registro de Silhouette.</small>
            </div>
          </div>

          <div className="silhouette-warning">
            <strong>⚠ Importante</strong>
            <ul>
              <li>Imprime la hoja con la Epson ET-8550 al <strong>100 %</strong> (sin escalado)</li>
              <li>Carga la hoja impresa en la CAMEO 5α</li>
              <li>Abre el SVG en Silhouette Studio Designer Edition o superior</li>
              <li>Activa la detección de marcas de registro en el panel Print & Cut</li>
              <li>Envía el trabajo a la CAMEO 5α</li>
            </ul>
          </div>
        </div>

        <div className="silhouette-actions">
          <button
            className="button-secondary"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </button>
          <button
            className="export-button"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exportando...' : '📤 Exportar para Silhouette'}
          </button>
        </div>
      </div>
    </div>
  );
}
