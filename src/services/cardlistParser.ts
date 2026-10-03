/**
 * Parses a raw cardlist string into structured card entries
 * Supports formats:
 * - "1 Sol Ring"
 * - "4 Lightning Bolt"
 * - "Sol Ring" (defaults to quantity 1)
 * - "1 Tifa Lockhart (FIN) 206" (with set code and collector number)
 * - "1 Harrow (EOC) 98-EASD" (with set code, collector number, and variant)
 * - Sections like "Commander", "Deck" (ignored)
 */

export interface ParsedCard {
  name: string;
  quantity: number;
  setCode?: string;
  collectorNumber?: string;
  variant?: string;
}

export function parseCardlist(input: string): ParsedCard[] {
  const lines = input.split('\n');
  const cards: ParsedCard[] = [];

  // List of known section headers to ignore
  const sectionHeaders = ['commander', 'deck', 'sideboard', 'maybeboard', 'land', 'creature', 'instant', 'sorcery', 'enchantment', 'artifact', 'planeswalker'];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) {
      continue;
    }

    // Skip known section headers
    if (sectionHeaders.includes(trimmed.toLowerCase())) {
      continue;
    }

    // Try to match: quantity + space + card name [+ (set code) collector_number [+ variant]]
    // Examples:
    // "1 Sol Ring"
    // "1 Tifa Lockhart (FIN) 206"
    // "1 Harrow (EOC) 98-EASD"
    const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s*\(([A-Z0-9]{2,4})\)\s*(\d+)(?:-(\S+))?)?$/);

    if (match) {
      const quantity = parseInt(match[1], 10);
      let name = match[2].trim();
      const setCode = match[3] || undefined;
      const collectorNumber = match[4] || undefined;
      const variant = match[5] || undefined;

      if (name) {
        cards.push({
          name,
          quantity,
          setCode,
          collectorNumber,
          variant,
        });
      }
    } else {
      // Treat entire line as card name with quantity 1
      // Check if it has set info anyway
      const simpleMatch = trimmed.match(/^(.+?)(?:\s*\(([A-Z0-9]{2,4})\)\s*(\d+)(?:-(\S+))?)?$/);
      
      if (simpleMatch && !trimmed.match(/^\d+\s/)) {
        // Line without quantity prefix
        const name = simpleMatch[1].trim();
        const setCode = simpleMatch[2] || undefined;
        const collectorNumber = simpleMatch[3] || undefined;
        const variant = simpleMatch[4] || undefined;

        if (name) {
          cards.push({
            name,
            quantity: 1,
            setCode,
            collectorNumber,
            variant,
          });
        }
      }
    }
  }

  return cards;
}
