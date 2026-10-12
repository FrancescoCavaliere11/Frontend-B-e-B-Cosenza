import {Place} from '../models/site.models';
import {MEDIA} from './media.registry';

export const PLACES_PAGE = {
  eyebrow: 'Dintorni',
  title: 'La Calabria, a partire dalla porta di casa',
  intro: 'Vicoli di pietra e palazzi nobiliari, i laghi e i giganti della Sila, il Tirreno a un\'ora di strada. I luoghi che amiamo e che vi consigliamo come si fa con gli amici.',
} as const;

/** Distanze indicative dalla struttura, da verificare. */
export const PLACES: ReadonlyArray<Place> = [
  {
    slug: 'centro-storico',
    name: 'Il centro storico',
    teaser: 'Cosenza vecchia, fra palazzi e chiese',
    distance: 'A piedi, 5 minuti',
    story: [
      'Salite Corso Telesio, l\'antica strada dei mercanti, fino al Duomo, patrimonio UNESCO come «Messaggero di una cultura di pace». Da lì, i vicoli si arrampicano sul colle Pancrazio fino al Castello Svevo.',
      'Fermatevi al Teatro Rendano, nelle botteghe degli artigiani e, al tramonto, sulla piazza XV Marzo, il salotto della città.',
    ],
    tips: ['Andateci di mattina presto, quando la luce è radente', 'Al Castello si sale anche in auto, ma a piedi è un\'altra cosa'],
    mapsQuery: 'Duomo di Cosenza',
    cover: MEDIA.oldTown,
    gallery: [MEDIA.oldTown, MEDIA.oldTownWalk, MEDIA.oldTownTower, MEDIA.oldTownPlants],
    placement: {colStart: 6, colEnd: 11},
  },
  {
    slug: 'sila',
    name: 'La Sila',
    teaser: 'Laghi, pini larici e silenzio',
    distance: 'In auto, 35 minuti',
    story: [
      'L\'altopiano più verde d\'Europa comincia appena fuori città. Camigliatello Silano è la porta d\'ingresso: funghi, formaggi, la seggiovia sul Monte Curcio.',
      'Poi i laghi — Cecita, Arvo, Ampollino — da percorrere a piedi, in bici o in canoa, e d\'inverno con le ciaspole.',
    ],
    tips: ['Portate una giacca anche d\'estate', 'In autunno, chiedeteci dove andare per funghi'],
    mapsQuery: 'Camigliatello Silano',
    cover: MEDIA.silaLake,
    gallery: [MEDIA.silaLake, MEDIA.silaForest, MEDIA.silaShore, MEDIA.silaCanoe],
    placement: {colStart: 3, colEnd: 8},
  },
  {
    slug: 'giganti-della-sila',
    name: 'I Giganti della Sila',
    teaser: 'Pini di oltre trecento anni',
    distance: 'In auto, 45 minuti',
    story: [
      'Nella Riserva di Fallistro, custodita dal FAI, crescono pini larici e aceri alti più di quaranta metri, piantati quando la Sila era ancora proprietà dei baroni.',
      'Un sentiero ad anello di poco più di un chilometro, adatto a tutti: si cammina col naso all\'insù.',
    ],
    tips: ['Verificate gli orari di apertura sul sito del FAI'],
    mapsQuery: 'Giganti della Sila Fallistro',
    cover: MEDIA.silaForest,
    gallery: [MEDIA.silaForest, MEDIA.silaLake, MEDIA.silaShore],
    placement: {colStart: 7, colEnd: 12},
  },
  {
    slug: 'paola',
    name: 'Paola e il Santuario',
    teaser: 'San Francesco, fra mare e montagna',
    distance: 'In auto, 40 minuti',
    story: [
      'Oltre il Passo della Crocetta, il Tirreno. Il Santuario di San Francesco di Paola è incastonato in una gola verde, con il ponte del Diavolo e la fonte della Cucchiarella.',
      'Scendete poi al borgo e al lungomare per un pranzo di pesce.',
    ],
    tips: ['Unitelo a un pomeriggio al mare'],
    mapsQuery: 'Santuario di San Francesco di Paola',
    cover: MEDIA.coastVillage,
    gallery: [MEDIA.coastVillage, MEDIA.coastRocks, MEDIA.coastSwim],
    placement: {colStart: 3, colEnd: 7},
  },
  {
    slug: 'riviera-dei-cedri',
    name: 'La Riviera dei Cedri',
    teaser: 'Diamante, i murales e il peperoncino',
    distance: 'In auto, 1 ora',
    story: [
      'Un tratto di costa che profuma di cedro: Diamante con i suoi murales e il festival del peperoncino, l\'isola di Cirella, le grotte di Scalea.',
      'Acqua limpidissima e spiagge di ciottoli bianchi.',
    ],
    tips: ['A settembre il mare è ancora caldo e le spiagge sono vuote'],
    mapsQuery: 'Diamante Calabria',
    cover: MEDIA.coastBeach,
    gallery: [MEDIA.coastBeach, MEDIA.coastBoats, MEDIA.coastSwim],
    placement: {colStart: 5, colEnd: 10},
  },
  {
    slug: 'tropea',
    name: 'Tropea',
    teaser: 'La perla del Tirreno',
    distance: 'In auto, 1 ora e 40',
    story: [
      'Il borgo a strapiombo sul mare, Santa Maria dell\'Isola sullo scoglio, la cipolla rossa. Una gita di un giorno che resta negli occhi.',
    ],
    tips: ['Partite presto e fermatevi a Pizzo per un tartufo gelato'],
    mapsQuery: 'Tropea',
    cover: MEDIA.coastCastle,
    gallery: [MEDIA.coastCastle, MEDIA.coastBoats, MEDIA.coastBeach],
    placement: {colStart: 2, colEnd: 7},
  },
];
