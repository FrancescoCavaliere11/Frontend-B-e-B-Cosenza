/**
 * Microcopy dell'interfaccia (bottoni, stati, errori). I testi editoriali
 * stanno in `content/`. Pronto per una futura versione inglese.
 */
export const UI = {
  nav: {
    menu: 'Menu',
    openMenu: 'Apri il menu',
    closeMenu: 'Chiudi il menu',
    book: 'Prenota',
    bookCompact: 'Prenota',
    home: 'Torna alla home',
    skip: 'Vai al contenuto',
  },
  common: {
    close: 'Chiudi',
    back: 'Indietro',
    previous: 'Precedente',
    next: 'Successiva',
    retry: 'Riprova',
    loading: 'Caricamento…',
    discover: 'Scopri',
    readMore: 'Leggi',
    directions: 'Indicazioni',
    perNight: 'a notte',
    from: 'da',
    upToGuests: (count: number) => `fino a ${count} ${count === 1 ? 'ospite' : 'ospiti'}`,
    galleryCounter: (current: number, total: number) => `${current} / ${total}`,
    openGallery: (name: string) => `Apri la galleria: ${name}`,
    slide: (current: number, total: number) => `Foto ${current} di ${total}`,
  },
  footer: {
    hours: 'Orari',
    contact: 'Contatti',
    booking: 'Prenotazioni',
    bookingText: 'Prenotate online o scriveteci: rispondiamo di persona.',
    manageBooking: 'Ritrova la tua prenotazione',
    rights: 'Tutti i diritti riservati',
  },
  rooms: {
    explore: 'Esplora la camera',
    bookThis: 'Prenota questa camera',
    details: 'La camera',
    amenities: 'Dotazioni',
    capacity: 'Ospiti',
    price: 'Prezzo',
    priceFrom: (price: string) => `da ${price} a notte`,
    dragHint: 'Trascina per esplorare',
    previewNotice: 'Anteprima: prezzi e disponibilità si caricano quando il sistema di prenotazione è raggiungibile.',
  },
  places: {
    howFar: 'Distanza',
    tips: 'I nostri consigli',
  },
  errors: {
    generic: 'Qualcosa non ha funzionato. Riprova fra poco.',
    network: 'Non riusciamo a raggiungere il sistema di prenotazione. Controlla la connessione e riprova.',
    rateLimited: (seconds: number) => `Troppe richieste in poco tempo: riprova fra ${seconds} secondi.`,
    notFoundTitle: 'Questa pagina non esiste',
    notFoundText: 'Forse il link è cambiato. Ricominciamo da casa?',
  },
  validation: {
    required: 'Campo obbligatorio',
    email: 'Inserisci un indirizzo email valido',
    minLength: (min: number) => `Almeno ${min} caratteri`,
    maxLength: (max: number) => `Al massimo ${max} caratteri`,
    terms: 'Per prenotare devi accettare i termini',
  },
} as const;
