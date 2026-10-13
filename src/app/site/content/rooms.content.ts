import {GridPlacement, MediaAsset} from '../models/site.models';
import {MEDIA} from './media.registry';

/**
 * Foto delle camere, per NUMERO di camera. È l'unico contenuto delle camere
 * che vive nel frontend: nome, descrizione, capienza, prezzo e servizi
 * arrivano dal backend. Quando esisterà il caricamento delle immagini
 * (lacuna B2) questo file sparisce.
 */
export const ROOM_GALLERIES: Readonly<Record<number, ReadonlyArray<MediaAsset>>> = {
  1: [MEDIA.roomOneA, MEDIA.roomOneB, MEDIA.roomOneC, MEDIA.roomOneD],
  2: [MEDIA.roomTwoA, MEDIA.roomTwoB, MEDIA.roomTwoC, MEDIA.roomTwoD],
  3: [MEDIA.roomThreeA, MEDIA.roomThreeB, MEDIA.roomThreeC, MEDIA.roomThreeD],
  4: [MEDIA.roomFourA, MEDIA.roomFourB, MEDIA.roomFourC, MEDIA.roomFourD],
};

/** Foto per una camera senza galleria dedicata. */
export const DEFAULT_ROOM_GALLERY: ReadonlyArray<MediaAsset> = [MEDIA.roomFourA, MEDIA.roomOneB, MEDIA.roomTwoC];

/** Disposizione sfalsata delle card nell'indice (si ripete in ciclo). */
export const ROOM_PLACEMENTS: ReadonlyArray<GridPlacement> = [
  {colStart: 3, colEnd: 7},
  {colStart: 7, colEnd: 11},
  {colStart: 2, colEnd: 7},
  {colStart: 7, colEnd: 12},
];

export const ROOMS_PAGE = {
  eyebrow: 'Le camere',
  title: 'Poche camere, ognuna con il suo carattere',
  intro: 'Scorri le fotografie, entra, guardati intorno.',
} as const;
