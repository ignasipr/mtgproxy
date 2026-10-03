// Represents a single printing variant of a card (may have multiple art variants)
export interface PrintingVariant {
  id: string; // Scryfall card ID
  setCode: string;
  setName?: string;
  illustrationId?: string; // For differentiating art variants
  artistName?: string;
  imageUrl?: string;
  lang?: string;
  releaseDate?: string;
}

// Represents a selected printing with chosen variant
export interface PrintingSelection {
  id: string; // Unique ID for this selection
  setCode: string;
  setName?: string;
  imageUrl?: string;
  variantId?: string; // Scryfall ID if variant is selected
  scryId?: string; // Scryfall ID of the card
}

export interface MtgCard {
  id: string; // Unique identifier (e.g., Scryfall ID)
  name: string;
  quantity: number;
  imageUrl?: string;
  scryId?: string;
  printings?: string[]; // Set codes this card appears in
}

export interface CardResolution {
  originalName: string;
  quantity: number;
  resolved: boolean;
  card?: MtgCard;
  error?: string;
}

// Represents a card in the deck workspace with printing selection
export interface DeckCard {
  name: string;
  quantity: number;
  scryId: string;
  originalCard: MtgCard; // Reference to resolved card
  printingSelection: PrintingSelection; // Currently selected printing
  availablePrintings?: PrintingVariant[]; // All available printings
  printingsLoading?: boolean;
  printingsError?: string;
}

export interface Deck {
  cards: CardResolution[];
  timestamp: number;
  name?: string;
}

// Workspace state for printing selection
export interface PrintingWorkspace {
  deckCards: DeckCard[]; // Cards with printing selections
  timestamp: number;
  name?: string;
  selectionCache: Map<string, PrintingSelection>; // Cache selections per card (scryId)
}
