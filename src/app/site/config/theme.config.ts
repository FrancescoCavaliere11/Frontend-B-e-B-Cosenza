import {ThemeColors, ThemeName} from '../models/site.models';

/**
 * Temi di colore: coppie sfondo/testo della palette condivisa
 * (`src/styles.css`). Un tema si cambia solo qui.
 */
export const THEMES: Readonly<Record<ThemeName, ThemeColors>> = {
  linen: {background: '--color-linen', text: '--color-espresso'},
  sand: {background: '--color-sand', text: '--color-espresso'},
  blush: {background: '--color-blush', text: '--color-espresso'},
  sage: {background: '--color-sage', text: '--color-linen'},
  forest: {background: '--color-primary', text: '--color-linen'},
  terracotta: {background: '--color-terracotta', text: '--color-linen'},
};

/** Tema di una pagina che non ne dichiara uno. */
export const DEFAULT_THEME: ThemeName = 'linen';

/** Chiave del `data` di rotta che porta il tema della pagina. */
export const ROUTE_THEME_KEY = 'theme';

/** Chiave del `data` di rotta con la descrizione per i motori di ricerca. */
export const ROUTE_DESCRIPTION_KEY = 'description';

/** Chiave del `data` di rotta per le pagine che si aprono in overlay. */
export const ROUTE_OVERLAY_KEY = 'overlay';
