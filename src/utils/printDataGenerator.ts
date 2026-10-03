/**
 * Print data generator
 * Converts deck data with quantities into expanded print entries (one per physical card)
 */

import type { DeckCard } from '../types/card';

export interface PrintEntry {
  cardName: string;
  imageUrl?: string;
  setCode: string;
  setName?: string;
  scryId: string;
  variantId?: string;
  index: number; // Which copy of this card (1, 2, 3... for 15x Forest)
  totalCopies: number; // Total quantity
}

/**
 * Expand deck cards with quantities into individual print entries
 * For example: "15 Forest" becomes 15 separate PrintEntry items
 * This is the data structure used for actual printing to TIFF/PDF
 */
export function generatePrintEntries(deckCards: DeckCard[]): PrintEntry[] {
  const entries: PrintEntry[] = [];

  for (const deckCard of deckCards) {
    // For each copy of the card (quantity times)
    for (let i = 1; i <= deckCard.quantity; i++) {
      entries.push({
        cardName: deckCard.name,
        imageUrl: deckCard.printingSelection.imageUrl,
        setCode: deckCard.printingSelection.setCode,
        setName: deckCard.printingSelection.setName,
        scryId: deckCard.scryId,
        variantId: deckCard.printingSelection.variantId,
        index: i,
        totalCopies: deckCard.quantity,
      });
    }
  }

  return entries;
}

/**
 * Get summary of print entries (for logging/UI feedback)
 */
export function getPrintSummary(entries: PrintEntry[]): {
  totalImages: number;
  uniqueCards: number;
  cardCounts: Map<string, number>;
} {
  const cardCounts = new Map<string, number>();
  let uniqueCards = 0;

  for (const entry of entries) {
    if (!cardCounts.has(entry.cardName)) {
      uniqueCards++;
    }
    cardCounts.set(entry.cardName, (cardCounts.get(entry.cardName) || 0) + 1);
  }

  return {
    totalImages: entries.length,
    uniqueCards,
    cardCounts,
  };
}
