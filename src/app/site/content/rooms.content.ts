import {GridPlacement, RoomContent} from '../models/site.models';
import {MEDIA} from './media.registry';

/**
 * Testi e gallerie delle camere, uniti ai dati del backend (nome, capienza,
 * prezzo, dotazioni) tramite il NUMERO di camera. Una camera del backend
 * senza contenuto qui riceve `GENERIC_ROOM_CONTENT`.
 */
export const ROOMS_CONTENT: ReadonlyArray<RoomContent> = [
  {
    number: 1,
    slug: 'camera-busento',
    name: 'Busento',
    headline: 'Luce del mattino, lino e legno',
    story: [
      'Prende il nome dal fiume che attraversa la città vecchia. È la camera più luminosa della casa: il sole entra presto e si posa sul pavimento di cotto.',
      'Lenzuola di lino lavate a mano, un piccolo scrittoio sotto la finestra e un bagno con due lavabi, per chi viaggia in due e ama prendersi i propri tempi.',
    ],
    details: ['Letto matrimoniale', 'Bagno privato con doccia', 'Vista sui tetti'],
    gallery: [MEDIA.roomOneA, MEDIA.roomOneB, MEDIA.roomOneC, MEDIA.roomOneD],
  },
  {
    number: 2,
    slug: 'camera-crati',
    name: 'Crati',
    headline: 'Un rifugio silenzioso sul cortile',
    story: [
      'Affacciata sul cortile interno, è la camera del silenzio: qui la città arriva solo come un\'eco lontana.',
      'Una testiera in legno di castagno della Sila, tessuti naturali e una poltrona per leggere fino a tardi.',
    ],
    details: ['Letto matrimoniale o due singoli', 'Bagno privato', 'Affaccio sul cortile'],
    gallery: [MEDIA.roomTwoA, MEDIA.roomTwoB, MEDIA.roomTwoC, MEDIA.roomTwoD],
  },
  {
    number: 3,
    slug: 'camera-telesio',
    name: 'Telesio',
    headline: 'La più ampia, per famiglie e lunghi soggiorni',
    story: [
      'Dedicata al filosofo cosentino che invitava a guardare la natura con i propri occhi. Spaziosa, con un angolo lettura e un letto aggiuntivo.',
      'Perfetta per una famiglia o per chi si ferma qualche giorno in più e vuole sentirsi a casa.',
    ],
    details: ['Letto matrimoniale + letto singolo', 'Angolo lettura', 'Bagno privato con vasca'],
    gallery: [MEDIA.roomThreeA, MEDIA.roomThreeB, MEDIA.roomThreeC, MEDIA.roomThreeD],
  },
  {
    number: 4,
    slug: 'suite-sila',
    name: 'Suite Sila',
    headline: 'Sotto le travi, con lo sguardo verso i monti',
    story: [
      'All\'ultimo piano, sotto le travi a vista: la suite guarda verso l\'altopiano della Sila e regala i tramonti più lunghi della casa.',
      'Un piccolo salotto, una cabina armadio e la colazione servita in camera, su richiesta.',
    ],
    details: ['Letto king size', 'Salotto privato', 'Colazione in camera su richiesta'],
    gallery: [MEDIA.roomFourA, MEDIA.roomFourB, MEDIA.roomFourC, MEDIA.roomFourD],
  },
];

/** Contenuto per una camera del backend non ancora descritta qui. */
export const GENERIC_ROOM_CONTENT: Omit<RoomContent, 'number' | 'slug' | 'name'> = {
  headline: 'Una camera curata in ogni dettaglio',
  story: ['Tessuti naturali, luce morbida e il silenzio del centro storico.'],
  details: ['Bagno privato'],
  gallery: [MEDIA.roomFourA, MEDIA.roomOneB, MEDIA.roomTwoC],
};

/** Disposizione sfalsata delle card nell'indice (si ripete in ciclo). */
export const ROOM_PLACEMENTS: ReadonlyArray<GridPlacement> = [
  {colStart: 3, colEnd: 7},
  {colStart: 7, colEnd: 11},
  {colStart: 2, colEnd: 7},
  {colStart: 7, colEnd: 12},
];

export const ROOMS_PAGE = {
  eyebrow: 'Le camere',
  title: 'Quattro stanze, quattro modi di abitare la città vecchia',
  intro: 'Ogni camera ha un nome che racconta Cosenza e un carattere tutto suo. Scorri le fotografie, entra, guardati intorno.',
} as const;
