import {InfoGroup} from '../models/site.models';
import {SITE} from '../config/site.config';
import {MEDIA} from './media.registry';

export const CONTACT_PAGE = {
  eyebrow: 'Contatti',
  title: 'Scriveteci, chiamateci, passate a trovarci',
  intro: 'Rispondiamo di persona, di solito entro poche ore.',
  media: MEDIA.entrance,
  mapTitle: 'Dove siamo',
  mapCta: 'Mostra la mappa',
  mapNotice: 'La mappa è fornita da OpenStreetMap e viene caricata solo quando la apri.',
  writeCta: 'Scrivi un\'email',
  mailSubject: 'Richiesta informazioni',
} as const;

export const CONTACT_GROUPS: ReadonlyArray<InfoGroup> = [
  {
    title: 'Recapiti',
    rows: [
      {label: 'Indirizzo', value: `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`},
      {label: 'Telefono', value: SITE.phone.display, href: SITE.phone.href},
      {label: 'Email', value: SITE.email.display, href: SITE.email.href},
      {label: 'Messaggi', value: SITE.whatsapp.display, href: SITE.whatsapp.href},
    ],
  },
  {
    title: 'Orari',
    rows: [
      {label: 'Check-in', value: SITE.checkIn},
      {label: 'Check-out', value: SITE.checkOut},
      {label: SITE.pastry.name, value: SITE.pastry.hours},
      {label: 'Accoglienza', value: SITE.reception},
    ],
  },
  {
    title: 'Come arrivare',
    rows: [
      {label: 'In auto', value: 'A2 del Mediterraneo, uscita Cosenza Nord; parcheggio convenzionato a 200 metri.'},
      {label: 'In treno', value: 'Stazione di Cosenza, 10 minuti in taxi. Possiamo venirvi a prendere.'},
      {label: 'In aereo', value: 'Aeroporto di Lamezia Terme, 60 minuti. Transfer su richiesta.'},
    ],
  },
  {
    title: 'Buono a sapersi',
    rows: [
      {label: 'Animali', value: 'Benvenuti i cani di piccola taglia, su richiesta.'},
      {label: 'Accessibilità', value: 'Il palazzo è storico: chiamateci per capire insieme se fa per voi.'},
      {label: 'Tassa di soggiorno', value: 'Da saldare in struttura, secondo il regolamento comunale.'},
    ],
  },
];
