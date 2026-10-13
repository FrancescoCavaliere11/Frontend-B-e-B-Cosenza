/**
 * Tipi del sito pubblico. Separati dagli schemi del backend (`app/schemas`):
 * descrivono contenuti editoriali e viste già pronte per i template.
 */

/** Nomi dei temi di colore definiti in `config/theme.config.ts`. */
export type ThemeName = 'linen' | 'sage' | 'sand' | 'blush' | 'forest' | 'terracotta';

/** Coppia sfondo/testo come nomi di variabili CSS della palette. */
export interface ThemeColors {
  background: string;
  text: string;
}

/** Rapporti d'aspetto ammessi per le immagini. */
export type MediaRatio = '3/4' | '4/5' | '2/3' | '1/1' | '4/3' | '3/2' | '16/9';

/** Immagine con segnaposto a bassa risoluzione per l'effetto blur-up. */
export interface MediaAsset {
  /** URL a piena risoluzione (larghezza di riferimento). */
  src: string;
  /** Varianti per `srcset`, già composte. */
  srcset: string;
  /** Segnaposto minuscolo, sfocato via CSS. */
  lqip: string;
  alt: string;
  ratio: MediaRatio;
  caption?: string;
}

/** Posizione su griglia a 12 colonne (da 768px in su). */
export interface GridPlacement {
  colStart: number;
  colEnd: number;
}

/** Voce di navigazione: link semplice o gruppo a tendina. */
export interface NavLink {
  label: string;
  path: string;
  fragment?: string;
}

export interface NavGroup {
  label: string;
  children: ReadonlyArray<NavLink>;
}

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

/** Link d'azione dei blocchi: rotta interna, esterna o apertura della prenotazione. */
export type BlockLink =
  | {kind: 'route'; label: string; path: string}
  | {kind: 'external'; label: string; href: string}
  | {kind: 'booking'; label: string};

/* ------------------------------------------------------------------ */
/* Blocchi editoriali (il «CMS» del sito, risolti da BlockRenderer)    */
/* ------------------------------------------------------------------ */

export interface TextBlock {
  type: 'text';
  eyebrow?: string;
  title?: string;
  paragraphs: ReadonlyArray<string>;
  link?: BlockLink;
  size?: 'default' | 'large';
  line?: boolean;
}

export interface MediaBlock {
  type: 'media';
  media: MediaAsset;
  placement: GridPlacement;
  eager?: boolean;
}

export interface CardBlock {
  type: 'card';
  title: string;
  headline: string;
  media: ReadonlyArray<MediaAsset>;
  placement: GridPlacement;
  link: BlockLink;
}

export interface SplitBlock {
  type: 'split';
  media: MediaAsset;
  eyebrow?: string;
  title: string;
  paragraphs: ReadonlyArray<string>;
  note?: string;
  reverse?: boolean;
  link?: BlockLink;
}

export interface EditorialCardBlock {
  type: 'editorial';
  media: MediaAsset;
  caption: string;
  meta?: string;
  placement: GridPlacement;
  path: string;
}

export type EditorialBlock = TextBlock | MediaBlock | CardBlock | SplitBlock | EditorialCardBlock;

/* ------------------------------------------------------------------ */
/* Contenuti di dominio                                                */
/* ------------------------------------------------------------------ */

/**
 * Camera pronta per il template. Tutti i dati vengono dal backend; dal
 * frontend arrivano solo le foto (finché manca il caricamento immagini,
 * lacuna B2) e la posizione nella griglia.
 */
export interface RoomView {
  id: string;
  number: number;
  /** Ricavato dal nome: è l'indirizzo della scheda (`/camere/busento`). */
  slug: string;
  name: string;
  /** Testo libero scritto dall'admin; `null` se assente. */
  description: string | null;
  capacity: number;
  /** Prezzo a notte come stringa decimale, mai convertito in numero. */
  price: string;
  /** Servizi assegnati alla camera nel backend, e solo quelli. */
  amenities: ReadonlyArray<string>;
  gallery: ReadonlyArray<MediaAsset>;
  placement: GridPlacement;
}

export interface ServiceItem {
  name: string;
  description: string;
  note: string;
  media: MediaAsset;
}

export interface PastryItem {
  name: string;
  description: string;
  season?: string;
  media: MediaAsset;
}

export interface Place {
  slug: string;
  name: string;
  teaser: string;
  distance: string;
  story: ReadonlyArray<string>;
  tips: ReadonlyArray<string>;
  mapsQuery: string;
  cover: MediaAsset;
  gallery: ReadonlyArray<MediaAsset>;
  placement: GridPlacement;
}

/** Riga «etichetta → valore» per contatti e informazioni utili. */
export interface InfoRow {
  label: string;
  value: string;
  href?: string;
}

export interface InfoGroup {
  title: string;
  rows: ReadonlyArray<InfoRow>;
}

export interface LegalSection {
  title: string;
  paragraphs: ReadonlyArray<string>;
}
