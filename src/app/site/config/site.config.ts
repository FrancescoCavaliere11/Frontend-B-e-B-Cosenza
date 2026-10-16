/**
 * Dati della struttura e chiavi pubbliche.
 *
 * ⚠️ Valori SEGNAPOSTO da sostituire con quelli reali (vedi
 * `Frontend_Customer_Plan.md`, «Da compilare»). Quando esisterà
 * `GET /public/config` (lacuna B9/B10) questo file diventerà il fallback.
 */
export const SITE = {
  name: 'Villa Rendano',
  shortName: 'Villa Rendano',
  kind: 'Bed & Breakfast',
  tagline: 'Un bed & breakfast di charme\nnel cuore antico di Cosenza',
  city: 'Cosenza',
  region: 'Calabria',
  address: {
    street: 'Centro storico',
    postalCode: '87100',
    city: 'Cosenza (CS)',
  },
  /** Coordinate per la mappa (centro storico di Cosenza). */
  geo: {lat: 39.2925, lng: 16.2561},
  phone: {display: '+39 0984 000 000', href: 'tel:+390984000000'},
  whatsapp: {display: 'WhatsApp', href: 'https://wa.me/390000000000'},
  email: {display: 'ciao@esempio.it', href: 'mailto:ciao@esempio.it'},
  checkIn: 'dalle 15:00 alle 20:00',
  checkOut: 'entro le 11:00',
  /**
   * La pasticceria è un'attività a parte, degli stessi proprietari: gli
   * ospiti possono fare colazione lì, se lo desiderano (a pagamento).
   */
  pastry: {
    name: 'Pasticceria Elimè',
    hours: 'Aperta tutti i giorni, dalle 6:00 alle 20:00',
  },
  reception: 'tutti i giorni, dalle 8:00 alle 20:00',
  social: [
    {label: 'Instagram', href: 'https://instagram.com/'},
    {label: 'Facebook', href: 'https://facebook.com/'},
  ],
  year: new Date().getFullYear(),
} as const;

/**
 * Chiavi PUBBLICHE dei servizi esterni. Vuote = funzione disattivata:
 * - senza `stripePublishableKey` il pagamento online mostra un avviso e
 *   propone il pagamento in struttura;
 * - senza `turnstileSiteKey` il captcha non viene caricato (come il backend
 *   con `CAPTCHA_ENABLED=false`).
 */
export const PUBLIC_KEYS = {
  stripePublishableKey: 'pk_test_51UP1Yk04QCAyfJijXWLWg8QS3ZUI64Vj7XCUD4HN0MZIjeZopc2il4YgWE7qFF18dXEk2kmnA8Al92KPnFyaIwqs00noQNVneQ',
  /**
   * CHIAVE DI PROVA di Cloudflare (passa sempre): va sostituita con quella
   * vera prima della pubblicazione (debito tecnico, «Chiavi Turnstile»).
   * Altre chiavi di prova: `2x00000000000000000000AB` (rifiuta sempre),
   * `3x00000000000000000000FF` (chiede sempre la spunta).
   */
  turnstileSiteKey: '1x00000000000000000000AA',
} as const;

/** Script esterni caricati solo quando servono. */
export const EXTERNAL_SCRIPTS = {
  stripe: 'https://js.stripe.com/v3/',
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
} as const;

/** Chiave di sessione: la copertina iniziale si vede una volta sola. */
export const INTRO_SEEN_STORAGE_KEY = 'site.intro.seen';

/** Tempi della copertina iniziale (ms). */
export const INTRO_TIMING = {
  claimVisible: 1700,
  wordmarkVisible: 1300,
  fadeOut: 700,
} as const;

/** Mappa OpenStreetMap incorporata, caricata solo al clic. */
export function osmEmbedUrl(lat: number, lng: number, delta = 0.012): string {
  const bbox = [lng - delta, lat - delta / 2, lng + delta, lat + delta / 2].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/** Indicazioni stradali verso un luogo (apre l'app mappe del dispositivo). */
export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
