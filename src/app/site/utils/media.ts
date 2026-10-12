import {GridPlacement} from '../models/site.models';

const DESKTOP_COLUMNS = 12;
const MOBILE_QUERY = '(max-width: 767px)';
/** Oltre questa larghezza il contenuto non cresce più. */
const MAX_LAYOUT_WIDTH = 1920;

/** Attributo `sizes` di un'immagine che occupa le colonne indicate. */
export function sizesFor(placement: GridPlacement | null | undefined): string {
  if (!placement) return `${MOBILE_QUERY} 100vw, 50vw`;
  const share = (placement.colEnd - placement.colStart) / DESKTOP_COLUMNS;
  const vw = Math.round(share * 100);
  const cap = Math.round(share * MAX_LAYOUT_WIDTH);
  return `${MOBILE_QUERY} 100vw, (max-width: ${MAX_LAYOUT_WIDTH}px) ${vw}vw, ${cap}px`;
}

/** Utente che ha chiesto meno animazioni al sistema operativo. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Tempo (ms) di una variabile CSS di durata, letta dal documento. */
export function cssDurationMs(name: string, fallback: number): number {
  if (typeof getComputedStyle === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = parseFloat(raw);
  return raw.endsWith('ms') ? value : value * 1000;
}
