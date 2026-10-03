/**
 * Printer configuration constants
 * Values validated from physical testing with Epson EcoTank ET-8550
 */

export const PRINTER_CONFIG = {
  // Card dimensions (MTG standard)
  card: {
    width_mm: 63.5,
    height_mm: 88.9,
  },

  // Resolution
  dpi: 600,

  // Page layout
  page: {
    width_mm: 210, // A4
    height_mm: 297, // A4
  },

  // Grid layout
  grid: {
    columns: 3,
    rows: 3,
    cardsPerPage: 9,
  },

  // Spacing
  spacing_mm: 2,

  // Calculated block dimensions (3×3 layout)
  block: {
    width_mm: 194.5,
    height_mm: 270.7,
  },
};

/**
 * Convert mm to pixels at DPI
 */
export function mmToPixels(mm: number, dpi: number = PRINTER_CONFIG.dpi): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convert pixels to mm at DPI
 */
export function pixelsToMm(pixels: number, dpi: number = PRINTER_CONFIG.dpi): number {
  return (pixels * 25.4) / dpi;
}

/**
 * Get card dimensions in pixels at target DPI
 */
export function getCardPixels(dpi: number = PRINTER_CONFIG.dpi) {
  return {
    width: mmToPixels(PRINTER_CONFIG.card.width_mm, dpi),
    height: mmToPixels(PRINTER_CONFIG.card.height_mm, dpi),
  };
}

/**
 * Get page dimensions in pixels at target DPI
 */
export function getPagePixels(dpi: number = PRINTER_CONFIG.dpi) {
  return {
    width: mmToPixels(PRINTER_CONFIG.page.width_mm, dpi),
    height: mmToPixels(PRINTER_CONFIG.page.height_mm, dpi),
  };
}

/**
 * Get spacing in pixels at target DPI
 */
export function getSpacingPixels(dpi: number = PRINTER_CONFIG.dpi) {
  return mmToPixels(PRINTER_CONFIG.spacing_mm, dpi);
}

/**
 * Validate that DPI meets minimum requirements
 */
export function validateDPI(dpi: number): boolean {
  return dpi >= 600;
}
