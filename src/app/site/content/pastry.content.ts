import {PastryItem} from '../models/site.models';
import {SITE} from '../config/site.config';
import {MEDIA} from './media.registry';

/**
 * La Pasticceria Elimè non fa parte del B&B: è il laboratorio degli stessi
 * proprietari. Chi soggiorna da noi può fare colazione lì, se lo desidera.
 */
export const PASTRY_PAGE = {
  eyebrow: 'Pasticceria e colazione',
  title: SITE.pastry.name,
  intro: 'La pasticceria della nostra famiglia: la stessa passione con cui vi accogliamo in casa, fra farina, burro e il profumo del forno acceso prima dell\'alba.',
  storyTitle: 'Fare colazione da Elimè',
  story: [
    'Elimè è un\'attività a sé, ma è casa nostra anche lei. Durante il soggiorno potete fermarvi a fare colazione al banco o a un tavolino: cornetti sfogliati al mattino, dolci della tradizione calabrese, un buon caffè.',
    'La colazione non è compresa nel prezzo della camera: si sceglie e si paga direttamente in pasticceria, quando e se ne avete voglia.',
  ],
  hours: SITE.pastry.hours,
  quote: 'Il dolce giusto è quello che sa di stagione.',
} as const;

export const PASTRY_ITEMS: ReadonlyArray<PastryItem> = [
  {name: 'Cornetto al burro', description: 'Sfogliato a mano, lievitazione lenta di ventiquattro ore.', media: MEDIA.pastryCornetto},
  {name: 'Cannoli', description: 'Cialda croccante, ricotta di pecora e scorza d\'arancia candita.', media: MEDIA.pastryCannoli},
  {name: 'Pitta \'mpigliata', description: 'La sfoglia di San Giovanni in Fiore: noci, uva passa, miele e cannella.', season: 'Inverno', media: MEDIA.pastryBaked},
  {name: 'Torta della domenica', description: 'Cioccolato fondente e una glassa leggera di latte.', media: MEDIA.pastryCake},
  {name: 'Crostata di ricotta', description: 'Ricotta fresca e gocce di cioccolato, come si faceva una volta.', media: MEDIA.pastryCheesecake},
  {name: 'Pasticcini del giorno', description: 'Piccoli assaggi che cambiano con le stagioni.', media: MEDIA.pastryPlate},
  {name: 'Lievitato al cioccolato', description: 'Morbido, per una colazione lenta.', media: MEDIA.pastryLoaf},
  {name: 'Da portare via', description: 'Una selezione in scatola, legata con lo spago.', media: MEDIA.pastryCannoliBox},
];
