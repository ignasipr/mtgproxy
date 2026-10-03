import { useEffect, useRef, useState } from 'react';
import type { DeckCard, PrintingSelection, PrintingVariant } from '../types/card';
import { getCardPrintings } from '../services/mtgApi';

/**
 * Hook para manejar selecciones de printing de una carta
 * Mantiene selecciones en sesión y evita re-renders innecesarios
 */
export function usePrintingSelection(deckCard: DeckCard) {
  const selectedRef = useRef<PrintingSelection | null>(
    deckCard.printingSelection || null
  );

  const updateSelection = (printing: PrintingVariant): void => {
    selectedRef.current = {
      id: `${deckCard.scryId}-${printing.setCode}`,
      setCode: printing.setCode,
      setName: printing.setName,
      imageUrl: printing.imageUrl,
      variantId: printing.id,
      scryId: deckCard.scryId,
    };
  };

  const getSelection = (): PrintingSelection => {
    return selectedRef.current || deckCard.printingSelection;
  };

  return { updateSelection, getSelection, selectedRef };
}

/**
 * Hook para cargar y cachear printings de una carta
 */
interface UsePrintingsResult {
  printings: PrintingVariant[];
  loading: boolean;
  error: string | null;
}

const printingsMemoryCache = new Map<string, PrintingVariant[]>();

export function usePrintings(
  cardName: string,
  scryId: string
): UsePrintingsResult {
  const [printings, setPrintings] = useState<PrintingVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const loadPrintings = async () => {
      const cacheKey = `${cardName}:${scryId}`;

      // Check memory cache first
      if (printingsMemoryCache.has(cacheKey)) {
        setPrintings(printingsMemoryCache.get(cacheKey) || []);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getCardPrintings(cardName);

        if (mountedRef.current) {
          setPrintings(result);
          printingsMemoryCache.set(cacheKey, result);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to load printings'
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadPrintings();

    return () => {
      mountedRef.current = false;
    };
  }, [cardName, scryId]);

  return { printings, loading, error };
}

/**
 * Hook para lazy-loading de imágenes con Intersection Observer
 */
export function useLazyImage(src: string | undefined) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setImageSrc(undefined);
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          setIsLoading(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const onLoad = () => setIsLoading(false);
  const onError = () => {
    setError('Failed to load image');
    setIsLoading(false);
  };

  return { ref, imageSrc, isLoading, error, onLoad, onError };
}
