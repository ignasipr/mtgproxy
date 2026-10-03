/**
 * Silhouette export service
 * Generates print + cut layouts compatible with Silhouette CAMEO 5α
 */

import type { PrintEntry } from '../utils/printDataGenerator';
import { PRINTER_CONFIG, getCardPixels, getPagePixels, mmToPixels } from '../config/printerConfig';

export interface CutPath {
  cardIndex: number;
  cardName: string;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  cornerRadius_mm: number;
}

export interface SilhouetteExportData {
  printImage: HTMLCanvasElement;
  cutPaths: CutPath[];
  svgContent: string;
  metadata: {
    pageWidth_mm: number;
    pageHeight_mm: number;
    cardsPerPage: number;
    cardWidth_mm: number;
    cardHeight_mm: number;
    dpi: number;
    registrationMarginMm: number;
  };
}

export interface SilhouetteConfig {
  cornerRadius_mm: number;
  registrationMarginMm: number;
  strokeColor: string;
  strokeWidth_px: number;
}

export const DEFAULT_SILHOUETTE_CONFIG: SilhouetteConfig = {
  cornerRadius_mm: 3,
  registrationMarginMm: 5, // Safe zone for registration marks
  strokeColor: '#FF0000', // Red for cut paths
  strokeWidth_px: 1,
};

/**
 * Generate SVG for cut paths
 * Creates rounded rectangle paths for each card at exact positions
 */
export function generateCutPathSVG(
  pages: Array<{ cards: PrintEntry[]; pageNumber: number }>,
  config: SilhouetteConfig = DEFAULT_SILHOUETTE_CONFIG,
  dpi: number = PRINTER_CONFIG.dpi
): string {
  const pagePixels = getPagePixels(dpi);
  const cardPixels = getCardPixels(dpi);
  const spacingPixels = mmToPixels(PRINTER_CONFIG.spacing_mm, dpi);
  const cornerRadiusPixels = mmToPixels(config.cornerRadius_mm, dpi);
  const regMarginPixels = mmToPixels(config.registrationMarginMm, dpi);

  // Calculate grid positioning (centered)
  const { columns, rows } = PRINTER_CONFIG.grid;
  const totalGridWidth = columns * cardPixels.width + (columns - 1) * spacingPixels;
  const totalGridHeight = rows * cardPixels.height + (rows - 1) * spacingPixels;
  const startX = (pagePixels.width - totalGridWidth) / 2;
  const startY = (pagePixels.height - totalGridHeight) / 2;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pagePixels.width}" height="${pagePixels.height}" viewBox="0 0 ${pagePixels.width} ${pagePixels.height}">
  <defs>
    <style>
      .cut-path { fill: none; stroke: ${config.strokeColor}; stroke-width: ${config.strokeWidth_px}px; }
      .registration-mark { fill: ${config.strokeColor}; }
    </style>
  </defs>
  
  <!-- Registration marks (four corners) -->
  <g class="registration-marks">
    <!-- Top-left -->
    <line x1="${regMarginPixels}" y1="${regMarginPixels - 5}" x2="${regMarginPixels}" y2="${regMarginPixels + 5}" class="registration-mark" stroke-width="2"/>
    <line x1="${regMarginPixels - 5}" y1="${regMarginPixels}" x2="${regMarginPixels + 5}" y2="${regMarginPixels}" class="registration-mark" stroke-width="2"/>
    
    <!-- Top-right -->
    <line x1="${pagePixels.width - regMarginPixels}" y1="${regMarginPixels - 5}" x2="${pagePixels.width - regMarginPixels}" y2="${regMarginPixels + 5}" class="registration-mark" stroke-width="2"/>
    <line x1="${pagePixels.width - regMarginPixels - 5}" y1="${regMarginPixels}" x2="${pagePixels.width - regMarginPixels + 5}" y2="${regMarginPixels}" class="registration-mark" stroke-width="2"/>
    
    <!-- Bottom-left -->
    <line x1="${regMarginPixels}" y1="${pagePixels.height - regMarginPixels - 5}" x2="${regMarginPixels}" y2="${pagePixels.height - regMarginPixels + 5}" class="registration-mark" stroke-width="2"/>
    <line x1="${regMarginPixels - 5}" y1="${pagePixels.height - regMarginPixels}" x2="${regMarginPixels + 5}" y2="${pagePixels.height - regMarginPixels}" class="registration-mark" stroke-width="2"/>
    
    <!-- Bottom-right -->
    <line x1="${pagePixels.width - regMarginPixels}" y1="${pagePixels.height - regMarginPixels - 5}" x2="${pagePixels.width - regMarginPixels}" y2="${pagePixels.height - regMarginPixels + 5}" class="registration-mark" stroke-width="2"/>
    <line x1="${pagePixels.width - regMarginPixels - 5}" y1="${pagePixels.height - regMarginPixels}" x2="${pagePixels.width - regMarginPixels + 5}" y2="${pagePixels.height - regMarginPixels}" class="registration-mark" stroke-width="2"/>
  </g>
  
  <!-- Cut paths -->
  <g class="cut-paths">`;

  let cardIndex = 0;
  for (const page of pages) {
    for (let idx = 0; idx < page.cards.length && idx < PRINTER_CONFIG.grid.cardsPerPage; idx++) {
      const col = idx % columns;
      const row = Math.floor(idx / columns);

      const x = startX + col * (cardPixels.width + spacingPixels);
      const y = startY + row * (cardPixels.height + spacingPixels);

      // Rounded rectangle path
      svgContent += `
    <!-- Card ${cardIndex}: ${page.cards[idx].cardName} -->
    <path class="cut-path" d="M ${x + cornerRadiusPixels} ${y} L ${x + cardPixels.width - cornerRadiusPixels} ${y} Q ${x + cardPixels.width} ${y} ${x + cardPixels.width} ${y + cornerRadiusPixels} L ${x + cardPixels.width} ${y + cardPixels.height - cornerRadiusPixels} Q ${x + cardPixels.width} ${y + cardPixels.height} ${x + cardPixels.width - cornerRadiusPixels} ${y + cardPixels.height} L ${x + cornerRadiusPixels} ${y + cardPixels.height} Q ${x} ${y + cardPixels.height} ${x} ${y + cardPixels.height - cornerRadiusPixels} L ${x} ${y + cornerRadiusPixels} Q ${x} ${y} ${x + cornerRadiusPixels} ${y}" />`;

      cardIndex++;
    }
  }

  svgContent += `
  </g>
</svg>`;

  return svgContent;
}

/**
 * Create CutPath metadata for each card
 */
export function generateCutPathMetadata(
  pages: Array<{ cards: PrintEntry[]; pageNumber: number }>,
  config: SilhouetteConfig = DEFAULT_SILHOUETTE_CONFIG,
  dpi: number = PRINTER_CONFIG.dpi
): CutPath[] {
  const cardPixels = getCardPixels(dpi);
  const spacingPixels = mmToPixels(PRINTER_CONFIG.spacing_mm, dpi);
  const { columns } = PRINTER_CONFIG.grid;
  const totalGridWidth = columns * cardPixels.width + (columns - 1) * spacingPixels;
  const totalGridHeight = Math.ceil(PRINTER_CONFIG.grid.cardsPerPage / columns) * cardPixels.height +
    (Math.ceil(PRINTER_CONFIG.grid.cardsPerPage / columns) - 1) * spacingPixels;
  const pagePixels = getPagePixels(dpi);
  const startX = (pagePixels.width - totalGridWidth) / 2;
  const startY = (pagePixels.height - totalGridHeight) / 2;

  const paths: CutPath[] = [];
  let cardIndex = 0;

  for (const page of pages) {
    for (let idx = 0; idx < page.cards.length && idx < PRINTER_CONFIG.grid.cardsPerPage; idx++) {
      const card = page.cards[idx];
      const col = idx % columns;
      const row = Math.floor(idx / columns);

      const x_px = startX + col * (cardPixels.width + spacingPixels);
      const y_px = startY + row * (cardPixels.height + spacingPixels);

      paths.push({
        cardIndex,
        cardName: card.cardName,
        x_mm: (x_px * 25.4) / dpi,
        y_mm: (y_px * 25.4) / dpi,
        width_mm: PRINTER_CONFIG.card.width_mm,
        height_mm: PRINTER_CONFIG.card.height_mm,
        cornerRadius_mm: config.cornerRadius_mm,
      });

      cardIndex++;
    }
  }

  return paths;
}

/**
 * Download SVG file
 */
export function downloadSVG(svgContent: string, filename: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download metadata as JSON
 */
export function downloadMetadata(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate canvas showing both print and cut areas with visual distinction
 */
export async function generatePreviewCanvas(
  printCanvas: HTMLCanvasElement,
  cutPathSvg: string,
  dpi: number = PRINTER_CONFIG.dpi
): Promise<HTMLCanvasElement> {
  const pagePixels = getPagePixels(dpi);
  const canvas = document.createElement('canvas');
  canvas.width = pagePixels.width;
  canvas.height = pagePixels.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Draw print area
  ctx.drawImage(printCanvas, 0, 0);

  // Parse SVG and draw cut paths
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(cutPathSvg, 'text/xml');
  const paths = svgDoc.querySelectorAll('.cut-path');

  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line for visual distinction

  paths.forEach((pathElement) => {
    const d = pathElement.getAttribute('d');
    if (d) {
      // Simple SVG path parsing (basic support for rounded rectangles)
      // For full SVG path parsing, consider using a library
      const pathRegex = /([A-Z])\s*([^A-Z]*)/gi;
      let match;
      let startX = 0,
        startY = 0;

      while ((match = pathRegex.exec(d)) !== null) {
        const command = match[1];
        const params = match[2].trim().split(/[\s,]+/).map(Number);

        if (command === 'M') {
          startX = params[0];
          startY = params[1];
          ctx.beginPath();
          ctx.moveTo(startX, startY);
        } else if (command === 'L') {
          ctx.lineTo(params[0], params[1]);
        } else if (command === 'Q') {
          ctx.quadraticCurveTo(params[0], params[1], params[2], params[3]);
        }
      }
      ctx.stroke();
    }
  });

  ctx.setLineDash([]);
  return canvas;
}
