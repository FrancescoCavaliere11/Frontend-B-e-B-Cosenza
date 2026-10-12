import {ServiceItem} from '../models/site.models';
import {MEDIA} from './media.registry';

export const SERVICES_PAGE = {
  eyebrow: 'Servizi',
  title: 'Piccole attenzioni, pensate per farvi sentire a casa',
  intro: 'Quello che non trovate qui potete chiederlo: proveremo sempre a rendere possibile ciò che rende speciale il vostro soggiorno.',
} as const;

/**
 * Servizi descritti in modo editoriale. Se il backend restituisce servizi
 * extra (`GET /extra-service/`), si usano quelli e da qui si prendono foto e
 * note per nome; altrimenti si mostra questo elenco.
 */
export const SERVICES_CONTENT: ReadonlyArray<ServiceItem> = [
  {
    name: 'Colazione alla Pasticceria Elimè',
    description: 'La pasticceria della nostra famiglia vi aspetta per la colazione: cornetti sfogliati al mattino, dolci della tradizione calabrese e un buon caffè. Si sceglie e si paga direttamente lì.',
    note: 'A pagamento',
    media: MEDIA.breakfastTable,
  },
  {
    name: 'Servizio taxi e transfer',
    description: 'Vi veniamo a prendere alla stazione di Cosenza o all\'aeroporto di Lamezia Terme, e vi accompagniamo dove volete: al mare, in Sila, a cena.',
    note: 'Su richiesta',
    media: MEDIA.serviceTransfer,
  },
  {
    name: 'Esperienze sul territorio',
    description: 'Un pomeriggio in pasticceria con le nostre mani in pasta, una degustazione di vini calabresi, un\'escursione guidata fra i laghi silani.',
    note: 'Su prenotazione',
    media: MEDIA.serviceExperience,
  },
  {
    name: 'Biciclette',
    description: 'Due ruote per scoprire il lungofiume e il centro storico al ritmo giusto, con una mappa dei nostri percorsi preferiti.',
    note: 'Gratuito',
    media: MEDIA.serviceBike,
  },
];

/** Foto di ricambio per i servizi del backend senza contenuto qui. */
export const SERVICE_FALLBACK_MEDIA = [MEDIA.lounge, MEDIA.hallway, MEDIA.windowView] as const;
