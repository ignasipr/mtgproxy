/**
 * MTG API Service using Scryfall
 * Scryfall is a free, public API with no authentication required
 * https://scryfall.com/docs/api
 * 
 * Rate limit: Scryfall allows approximately 10-20 requests per second
 * We implement throttling to respect this limit
 */

import type { PrintingVariant } from '../types/card';
import { apiRateLimiter } from '../utils/apiRateLimiter';

interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name?: string;
  image_uris?: {
    normal?: string;
    small?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
      small?: string;
    };
  }>;
  illustration_id?: string;
  artist?: string;
  released_at?: string;
  lang?: string;
  prints_search_uri?: string;
  scryfall_uri?: string;
}

const SCRYFALL_API_BASE = 'https://api.scryfall.com';
const printingsCache = new Map<string, PrintingVariant[]>();

export interface ResolvedCard {
  id: string;
  name: string;
  imageUrl?: string;
  scryId: string;
  printings?: string[];
}

/**
 * Search for a card by name
 */
export async function searchCard(cardName: string): Promise<ResolvedCard | null> {
  return apiRateLimiter.throttle(async () => {
    try {
      const query = encodeURIComponent(cardName);
      const response = await fetch(
        `${SCRYFALL_API_BASE}/cards/search?q=${query}&unique=prints&order=released&dir=desc`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        if (response.status === 429) {
          throw new Error('429: Rate limit exceeded - backing off');
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data = await response.json() as { data?: ScryfallCard[] };

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const card = data.data[0];
      return normalizeScryfallCard(card);
    } catch (error) {
      console.error(`Failed to search card "${cardName}":`, error);
      return null;
    }
  });
}

/**
 * Search for an exact card match (faster, more precise)
 */
export async function searchCardExact(cardName: string): Promise<ResolvedCard | null> {
  return apiRateLimiter.throttle(async () => {
    try {
      const response = await fetch(
        `${SCRYFALL_API_BASE}/cards/named?exact=${encodeURIComponent(cardName)}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        if (response.status === 429) {
          throw new Error('429: Rate limit exceeded - backing off');
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const card = await response.json() as ScryfallCard;
      return normalizeScryfallCard(card);
    } catch (error) {
      console.error(`Failed to search card "${cardName}":`, error);
      return null;
    }
  });
}

/**
 * Get all printings of a card with details
 * Uses in-memory cache to avoid duplicate API calls
 */
export async function getCardPrintings(cardName: string): Promise<PrintingVariant[]> {
  return apiRateLimiter.throttle(async () => {
    // Check cache first
    if (printingsCache.has(cardName)) {
      return printingsCache.get(cardName) || [];
    }

    try {
      // Search for all printings of this card
      const query = encodeURIComponent(`!"${cardName}"`);
      const response = await fetch(
        `${SCRYFALL_API_BASE}/cards/search?q=${query}&unique=prints&order=released&dir=desc`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('429: Rate limit exceeded - backing off');
        }
        console.warn(`Failed to fetch printings for "${cardName}": ${response.status}`);
        return [];
      }

      const data = await response.json() as { data?: ScryfallCard[] };
      if (!data.data) {
        return [];
      }

      // Normalize each printing
      const printings: PrintingVariant[] = data.data.map(card => ({
        id: card.id,
        setCode: card.set.toUpperCase(),
        setName: card.set_name,
        illustrationId: card.illustration_id,
        artistName: card.artist,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
        lang: card.lang,
        releaseDate: card.released_at,
      }));

      // Cache the result
      printingsCache.set(cardName, printings);

      return printings;
    } catch (error) {
      console.error(`Failed to get printings for "${cardName}":`, error);
      return [];
    }
  });
}

/**
 * Get a specific card printing by set code
 */
export async function getCardPrintingBySet(cardName: string, setCode: string): Promise<PrintingVariant | null> {
  return apiRateLimiter.throttle(async () => {
    try {
      const query = encodeURIComponent(`!"${cardName}" set:${setCode.toLowerCase()}`);
      const response = await fetch(
        `${SCRYFALL_API_BASE}/cards/search?q=${query}&unique=prints`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('429: Rate limit exceeded - backing off');
        }
        return null;
      }

      const data = await response.json() as { data?: ScryfallCard[] };
      if (!data.data || data.data.length === 0) {
        return null;
      }

      const card = data.data[0];
      return {
        id: card.id,
        setCode: card.set.toUpperCase(),
        setName: card.set_name,
        illustrationId: card.illustration_id,
        artistName: card.artist,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
        lang: card.lang,
        releaseDate: card.released_at,
      };
    } catch (error) {
      console.error(`Failed to get card printing for "${cardName}" in set "${setCode}":`, error);
      return null;
    }
  });
}

/**
 * Clear the printings cache (useful for testing or memory management)
 */
export function clearPrintingsCache(): void {
  printingsCache.clear();
}

function normalizeScryfallCard(card: ScryfallCard): ResolvedCard {
  let imageUrl: string | undefined;

  // Prefer normal image from image_uris
  if (card.image_uris?.normal) {
    imageUrl = card.image_uris.normal;
  } else if (card.card_faces?.[0]?.image_uris?.normal) {
    // For double-faced cards
    imageUrl = card.card_faces[0].image_uris.normal;
  }

  return {
    id: card.id,
    name: card.name,
    imageUrl,
    scryId: card.id,
  };
}
