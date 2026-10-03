/**
 * Print layout generation service
 * Generates print pages at exact dimensions without scaling
 */

import type { PrintEntry } from '../utils/printDataGenerator';
import {
  PRINTER_CONFIG,
  getCardPixels,
  getPagePixels,
  getSpacingPixels,
  mmToPixels,
} from '../config/printerConfig';

export interface PrintPage {
  pageNumber: number;
  cards: PrintEntry[];
  canvas?: HTMLCanvasElement;
}

/**
 * Paginate print entries into groups of cardsPerPage
 */
export function paginatePrintEntries(entries: PrintEntry[]): PrintPage[] {
  const pages: PrintPage[] = [];
  const cardsPerPage = PRINTER_CONFIG.grid.cardsPerPage;

  for (let i = 0; i < entries.length; i += cardsPerPage) {
    pages.push({
      pageNumber: pages.length + 1,
      cards: entries.slice(i, i + cardsPerPage),
    });
  }

  return pages;
}

/**
 * Generate canvas for a single print page
 * Returns a canvas with exact pixel dimensions matching A4 at 600 DPI
 */
export async function generatePageCanvas(
  page: PrintPage,
  dpi: number = PRINTER_CONFIG.dpi
): Promise<HTMLCanvasElement> {
  const pagePixels = getPagePixels(dpi);
  const canvas = document.createElement('canvas');
  canvas.width = pagePixels.width;
  canvas.height = pagePixels.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each card
  const cardPixels = getCardPixels(dpi);
  const spacingPixels = getSpacingPixels(dpi);
  const { columns, rows } = PRINTER_CONFIG.grid;

  // Center the grid on the page
  const totalGridWidth = columns * cardPixels.width + (columns - 1) * spacingPixels;
  const totalGridHeight = rows * cardPixels.height + (rows - 1) * spacingPixels;
  const startX = (canvas.width - totalGridWidth) / 2;
  const startY = (canvas.height - totalGridHeight) / 2;

  for (let idx = 0; idx < page.cards.length && idx < PRINTER_CONFIG.grid.cardsPerPage; idx++) {
    const card = page.cards[idx];
    const col = idx % columns;
    const row = Math.floor(idx / columns);

    const x = startX + col * (cardPixels.width + spacingPixels);
    const y = startY + row * (cardPixels.height + spacingPixels);

    // Draw card background (light gray placeholder if no image)
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(x, y, cardPixels.width, cardPixels.height);

    // Load and draw card image
    if (card.imageUrl) {
      try {
        const img = await loadImage(card.imageUrl);
        ctx.drawImage(img, x, y, cardPixels.width, cardPixels.height);
      } catch (error) {
        // Failed to load image, keep placeholder
        ctx.fillStyle = '#FF6B6B';
        ctx.font = '14px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('No image', x + 10, y + 30);
      }
    } else {
      // Draw "No image" placeholder
      ctx.fillStyle = '#FF6B6B';
      ctx.font = '14px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('No image', x + 10, y + 30);
    }

    // Draw border
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardPixels.width, cardPixels.height);

    // Draw card metadata in corner
    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.fillText(`${card.index}/${card.totalCopies}`, x + 5, y + cardPixels.height - 5);
  }

  return canvas;
}

/**
 * Load image from URL and return as HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Generate PNG blob from canvas
 */
export function canvasToPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate PNG'));
        }
      },
      'image/png'
    );
  });
}

/**
 * Generate all print pages
 */
export async function generateAllPages(
  entries: PrintEntry[],
  dpi: number = PRINTER_CONFIG.dpi
): Promise<PrintPage[]> {
  const pages = paginatePrintEntries(entries);

  const pagesWithCanvases: PrintPage[] = [];
  for (const page of pages) {
    const canvas = await generatePageCanvas(page, dpi);
    pagesWithCanvases.push({ ...page, canvas });
  }

  return pagesWithCanvases;
}

/**
 * Download PNG file from canvas
 */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/**
 * Download all pages as individual PNG files
 */
export function downloadAllPagesAsPNG(pages: PrintPage[], deckName: string = 'Deck') {
  for (const page of pages) {
    if (page.canvas) {
      downloadCanvasAsPNG(page.canvas, `${deckName}_Page_${page.pageNumber}.png`);
    }
  }
}
