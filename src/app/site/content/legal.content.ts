import {LegalSection} from '../models/site.models';
import {SITE} from '../config/site.config';

/**
 * ⚠️ Testi SEGNAPOSTO: vanno rivisti da un consulente prima della
 * pubblicazione (lacuna backend B12: versionare i termini accettati).
 */
export const PRIVACY_PAGE: {title: string; updated: string; sections: ReadonlyArray<LegalSection>} = {
  title: 'Informativa sulla privacy',
  updated: 'Bozza da completare',
  sections: [
    {
      title: 'Titolare del trattamento',
      paragraphs: [`${SITE.name}, ${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}. Contatto: ${SITE.email.display}.`],
    },
    {
      title: 'Dati raccolti',
      paragraphs: [
        'Per gestire la prenotazione raccogliamo nome, cognome, email e telefono. Il pagamento online è gestito da Stripe: i dati della carta non transitano né restano sui nostri sistemi.',
      ],
    },
    {
      title: 'Finalità e conservazione',
      paragraphs: [
        'Usiamo i dati solo per la prenotazione, gli obblighi di legge (comunicazione alle autorità di pubblica sicurezza, fiscali) e per rispondere alle vostre richieste.',
      ],
    },
    {
      title: 'Servizi di terze parti',
      paragraphs: [
        'Il controllo anti-bot è fornito da Cloudflare Turnstile, i pagamenti da Stripe, la mappa da OpenStreetMap (caricata solo su vostra richiesta).',
      ],
    },
    {
      title: 'I vostri diritti',
      paragraphs: ['Potete chiedere accesso, rettifica o cancellazione dei vostri dati scrivendo all\'indirizzo del titolare.'],
    },
  ],
};

export const TERMS_PAGE: {title: string; updated: string; sections: ReadonlyArray<LegalSection>} = {
  title: 'Termini di prenotazione',
  updated: 'Bozza da completare',
  sections: [
    {
      title: 'Come funziona',
      paragraphs: [
        'Scelte le date e le camere, potete pagare in struttura o online con uno sconto del 10%. Le camere restano bloccate per 15 minuti mentre completate la richiesta.',
        'Con il pagamento in struttura vi inviamo un\'email con un link: la prenotazione è confermata quando lo aprite. Con il pagamento online la conferma arriva appena il pagamento è accettato.',
      ],
    },
    {
      title: 'Pagamento online',
      paragraphs: [
        'L\'importo viene prima autorizzato sulla carta e addebitato solo quando verifichiamo che le camere siano ancora vostre. Se nel frattempo non lo fossero più, l\'autorizzazione viene rilasciata e non vi viene addebitato nulla.',
      ],
    },
    {
      title: 'Cancellazione',
      paragraphs: [
        'Potete annullare gratuitamente fino al termine indicato nell\'email di conferma, dal link «Gestisci la prenotazione». Oltre quel termine, contattateci.',
      ],
    },
    {
      title: 'Arrivo e partenza',
      paragraphs: [`Check-in ${SITE.checkIn}, check-out ${SITE.checkOut}. La tassa di soggiorno si salda in struttura.`],
    },
  ],
};
