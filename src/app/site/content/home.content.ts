import {EditorialBlock, ThemeName} from '../models/site.models';
import {SITE_ROUTES} from '../config/navigation.config';
import {MEDIA} from './media.registry';

/** Una fascia della Home: i suoi blocchi e il tema che attiva allo scroll. */
export interface HomeSection {
  id: string;
  theme: ThemeName;
  blocks: ReadonlyArray<EditorialBlock>;
}

export const HOME_HERO = MEDIA.heroBalcony;

export const HOME_SECTIONS: ReadonlyArray<HomeSection> = [
  {
    id: 'benvenuti',
    theme: 'linen',
    blocks: [
      {
        type: 'text',
        eyebrow: 'Benvenuti',
        title: 'Una casa antica, poche camere, il tempo giusto',
        paragraphs: [
          'Un palazzo dell\'Ottocento fra i vicoli della Cosenza vecchia, restaurato con pazienza. Quattro camere, la pasticceria di famiglia per la colazione e la Calabria tutta intorno.',
        ],
        size: 'large',
        line: true,
      },
      {
        type: 'card',
        title: 'Le camere',
        headline: 'Lino, legno e luce del mattino',
        media: [MEDIA.roomOneA, MEDIA.roomTwoA, MEDIA.roomThreeA, MEDIA.roomFourA],
        placement: {colStart: 3, colEnd: 7},
        link: {kind: 'route', label: 'Scopri le camere', path: SITE_ROUTES.rooms},
      },
    ],
  },
  {
    id: 'colazione',
    theme: 'sand',
    blocks: [
      {
        type: 'card',
        title: 'Pasticceria Elimè',
        headline: 'Colazione e dolci, dalle sei del mattino',
        media: [MEDIA.pastryHero, MEDIA.pastryCornetto, MEDIA.pastryCannoli],
        placement: {colStart: 7, colEnd: 11},
        link: {kind: 'route', label: 'Scopri la pasticceria', path: SITE_ROUTES.pastry},
      },
      {
        type: 'card',
        title: 'Servizi',
        headline: 'Colazione, transfer, esperienze',
        media: [MEDIA.breakfastTable],
        placement: {colStart: 3, colEnd: 7},
        link: {kind: 'route', label: 'Tutti i servizi', path: SITE_ROUTES.services},
      },
    ],
  },
  {
    id: 'dintorni',
    theme: 'forest',
    blocks: [
      {
        type: 'card',
        title: 'Dintorni',
        headline: 'Dalla Sila al Tirreno',
        media: [MEDIA.silaLake, MEDIA.coastCastle, MEDIA.oldTown],
        placement: {colStart: 7, colEnd: 11},
        link: {kind: 'route', label: 'Esplora il territorio', path: SITE_ROUTES.places},
      },
      {
        type: 'split',
        media: MEDIA.entrance,
        eyebrow: 'Come arrivare',
        title: 'Nel cuore della città vecchia',
        paragraphs: [
          'A cinque minuti a piedi dal Duomo, a dieci dalla stazione di Cosenza in taxi, a un\'ora dall\'aeroporto di Lamezia Terme.',
        ],
        link: {kind: 'route', label: 'Contatti e mappa', path: SITE_ROUTES.contact},
      },
    ],
  },
  {
    id: 'prenota',
    theme: 'terracotta',
    blocks: [
      {
        type: 'text',
        eyebrow: 'Prenota',
        title: 'Vi aspettiamo',
        paragraphs: [
          'Prenotando direttamente qui avete il prezzo migliore e, se pagate online, il 10% di sconto. Potete annullare gratuitamente fino al termine indicato nella conferma.',
        ],
        size: 'large',
        link: {kind: 'booking', label: 'Verifica disponibilità'},
      },
    ],
  },
];
