import {NavItem, NavLink} from '../models/site.models';

/** Rotte del sito: un solo punto in cui si scrivono i percorsi. */
export const SITE_ROUTES = {
  home: '/',
  rooms: '/camere',
  services: '/servizi',
  pastry: '/pasticceria',
  places: '/territorio',
  contact: '/contatti',
  book: '/prenota',
  bookingLookup: '/prenotazione',
  bookingConfirm: '/prenotazione/conferma',
  bookingManage: '/prenotazione/gestisci',
  privacy: '/privacy',
  terms: '/termini',
} as const;

export function roomPath(slug: string): string {
  return `${SITE_ROUTES.rooms}/${slug}`;
}

export function placePath(slug: string): string {
  return `${SITE_ROUTES.places}/${slug}`;
}

/** Navigazione principale (a sinistra del logo su desktop). */
export const MAIN_NAV: ReadonlyArray<NavItem> = [
  {
    label: 'La casa',
    children: [
      {label: 'Le camere', path: SITE_ROUTES.rooms},
      {label: 'Servizi', path: SITE_ROUTES.services},
      {label: 'Pasticceria e colazione', path: SITE_ROUTES.pastry},
    ],
  },
  {label: 'Dintorni', path: SITE_ROUTES.places},
  {label: 'Contatti', path: SITE_ROUTES.contact},
];

/** Link del footer. */
export const LEGAL_NAV: ReadonlyArray<NavLink> = [
  {label: 'Privacy', path: SITE_ROUTES.privacy},
  {label: 'Termini di prenotazione', path: SITE_ROUTES.terms},
  {label: 'La mia prenotazione', path: SITE_ROUTES.bookingLookup},
];
