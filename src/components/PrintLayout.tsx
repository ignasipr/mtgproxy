import { useState, useEffect } from 'react';
import type { Deck, PrintingVariant } from '../types/card';
import { generatePrintEntries, type PrintEntry } from '../utils/printDataGenerator';
import { paginatePrintEntries, generatePageCanvas, downloadCanvasAsPNG } from '../services/printLayoutService';
import { PRINTER_CONFIG } from '../config/printerConfig';
import PrintPreview from './PrintPreview';
import CalibrationPage from './CalibrationPage';
import SilhouetteExportModal from './SilhouetteExportModal';
import './PrintLayout.css';

interface PrintLayoutProps {
  deck: Deck;
  printingSelections?: Map<string, PrintingVariant>;
  onBack: () => void;
}

export default function PrintLayout({ deck, printingSelections = new Map(), onBack }: PrintLayoutProps) {
  const [printEntries, setPrintEntries] = useState<PrintEntry[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showSilhouetteExport, setShowSilhouetteExport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dpi, setDpi] = useState(PRINTER_CONFIG.dpi);

  useEffect(() => {
    // Convert CardResolution to PrintEntry format
    const entries: PrintEntry[] = [];
    for (const card of deck.cards) {
      if (!card.resolved || !card.card) continue;

      const cardId = card.card.scryId || card.card.id;
      const selectedPrinting = printingSelections.get(cardId);
      const imageUrl = selectedPrinting?.imageUrl || card.card.imageUrl;

      for (let i = 1; i <= card.quantity; i++) {
        entries.push({
          cardName: card.card.name,
          imageUrl,
          setCode: selectedPrinting?.setCode || 'UNKNOWN',
          setName: selectedPrinting?.setName,
          scryId: cardId,
          variantId: selectedPrinting?.id,
          index: i,
          totalCopies: card.quantity,
        });
      }
    }
    setPrintEntries(entries);
  }, [deck, printingSelections]);

  const pages = paginatePrintEntries(printEntries);
  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;

  const handleDownloadCurrentPage = async () => {
    if (!currentPage.canvas) {
      setIsGenerating(true);
      try {
        const canvas = await generatePageCanvas(currentPage, dpi);
        downloadCanvasAsPNG(canvas, `Print_Page_${currentPage.pageNumber}.png`);
      } finally {
        setIsGenerating(false);
      }
    } else {
      downloadCanvasAsPNG(currentPage.canvas, `Print_Page_${currentPage.pageNumber}.png`);
    }
  };

  const handleDownloadAllPages = async () => {
    setIsGenerating(true);
    try {
      for (const page of pages) {
        const canvas = await generatePageCanvas(page, dpi);
        downloadCanvasAsPNG(canvas, `Print_Page_${page.pageNumber}.png`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    // Open browser print dialog with current page
    window.print();
  };

  return (
    <div className="print-layout">
      <header className="print-header">
        <h1>Preparar Impresión</h1>
        <button className="back-button" onClick={onBack}>
          ← Volver
        </button>
      </header>

      <div className="print-content">
        {showCalibration ? (
          <CalibrationPage onClose={() => setShowCalibration(false)} />
        ) : (
          <>
            <div className="print-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Páginas:</span>
                  <span className="value">{totalPages}</span>
                </div>
                <div className="info-item">
                  <span className="label">Cartas totales:</span>
                  <span className="value">{printEntries.length}</span>
                </div>
                <div className="info-item">
                  <span className="label">Tamaño de carta:</span>
                  <span className="value">63.5 × 88.9 mm</span>
                </div>
                <div className="info-item">
                  <span className="label">DPI:</span>
                  <span className="value">{dpi} ppp</span>
                </div>
                <div className="info-item">
                  <span className="label">Escala:</span>
                  <span className="value">100 %</span>
                </div>
              </div>

              <div className="warning-box">
                <strong>⚠ IMPORTANTE</strong>
                <p>
                  Asegúrate de que <strong>NO</strong> esté activado "Ajustar a página" ni ningún escalado automático.
                </p>
                <p>Las cartas deben imprimirse al <strong>100 %</strong> / tamaño físico real.</p>
              </div>
            </div>

            <div className="preview-section">
              <PrintPreview
                page={currentPage}
                pageNumber={currentPageIndex + 1}
                totalPages={totalPages}
                dpi={dpi}
                onPageChange={setCurrentPageIndex}
              />
            </div>

            <div className="print-controls">
              <div className="control-group">
                <label htmlFor="dpi-select">Resolución (DPI):</label>
                <select
                  id="dpi-select"
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  <option value={600}>600 ppp (Recomendado)</option>
                  <option value={1200}>1200 ppp</option>
                </select>
              </div>

              <button
                className="calibration-button"
                onClick={() => setShowCalibration(true)}
                disabled={isGenerating}
              >
                📏 Página de Calibración
              </button>

              <button
                className="button-secondary"
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0 || isGenerating}
              >
                ← Página Anterior
              </button>

              <div className="page-counter">
                Página {currentPageIndex + 1} de {totalPages}
              </div>

              <button
                className="button-secondary"
                onClick={() => setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === totalPages - 1 || isGenerating}
              >
                Página Siguiente →
              </button>
            </div>

            <div className="print-actions">
              <button
                className="button-secondary"
                onClick={handleDownloadCurrentPage}
                disabled={isGenerating}
              >
                💾 Exportar Página Actual
              </button>

              <button
                className="button-secondary"
                onClick={handleDownloadAllPages}
                disabled={isGenerating}
              >
                💾 Exportar Todas las Páginas
              </button>

              <button
                className="button-secondary"
                onClick={() => setShowSilhouetteExport(true)}
                disabled={isGenerating}
              >
                ✂️ Preparar para Silhouette
              </button>

              <button className="print-button" onClick={handlePrint} disabled={isGenerating}>
                🖨️ IMPRIMIR
              </button>
            </div>

            {isGenerating && <div className="generating-overlay">Generando páginas...</div>}

            {showSilhouetteExport && (
              <SilhouetteExportModal
                pages={pages}
                dpi={dpi}
                onClose={() => setShowSilhouetteExport(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
