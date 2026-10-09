/**
 * Cambi di stato che l'amministratore può disporre dalla scheda di una
 * prenotazione.
 *
 * È lo specchio di `ALLOWED_TRANSITIONS` del backend **meno** le transizioni
 * che appartengono ad altri attori (`_assert_admin_transition`):
 *
 * - `→ EXPIRED` è dello sweeper: per liberare subito le camere si annulla;
 * - `PENDING_PAYMENT → CONFIRMED` è del pagamento online (webhook Stripe).
 *
 * Il backend resta l'unica fonte di verità: qui si decide solo quali pulsanti
 * mostrare e cosa dire. Una regola che divergesse produrrebbe al massimo un
 * errore gestito, mai un cambio di stato non ammesso.
 */
import {BookingStatus, PaymentOption, PaymentStatus} from './booking-enums';
import {describeDeadline, formatStayDate} from '../utils/booking-format';

/** Lunghezza massima della motivazione — `BookingStatusUpdateSchema.reason`. */
export const STATUS_REASON_MAX_LENGTH = 500;

/** Stile del pulsante: corrisponde alle classi `button.<tone>` di form.css. */
export type StatusActionTone = 'primary' | 'secondary' | 'danger';

/** Un'azione della sezione «Azioni». */
export interface StatusAction {
  target: BookingStatus;
  /** Testo del pulsante. */
  label: string;
  /** Testo del pulsante che conferma l'azione. */
  confirmLabel: string;
  tone: StatusActionTone;
}

/** Richiesta emessa dalla scheda quando l'admin conferma un'azione. */
export interface StatusChangeRequest {
  status: BookingStatus;
  /** Già ripulita dagli spazi; assente se non è stata scritta. */
  reason?: string;
}

/** Dati della prenotazione che servono a decidere azioni e testi. */
export interface TransitionContext {
  status: BookingStatus;
  check_in: string;
  check_out: string;
  hold_expires_at: string | null;
  payment_status: PaymentStatus;
  payment_option: PaymentOption;
}

/** Destinazioni ammesse per l'admin, nell'ordine in cui compaiono i pulsanti. */
export const ADMIN_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  [BookingStatus.PENDING_CONFIRMATION]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.PENDING_PAYMENT]: [BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.NO_SHOW, BookingStatus.CANCELLED],
  [BookingStatus.CHECKED_IN]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.EXPIRED]: [],
  [BookingStatus.NO_SHOW]: [],
};

/** Come si presenta ogni azione, indicizzata per stato di destinazione. */
export const STATUS_ACTIONS: Readonly<Partial<Record<BookingStatus, StatusAction>>> = {
  [BookingStatus.CONFIRMED]: {
    target: BookingStatus.CONFIRMED, label: 'Conferma', confirmLabel: 'Sì, conferma', tone: 'primary',
  },
  [BookingStatus.CHECKED_IN]: {
    target: BookingStatus.CHECKED_IN, label: 'Registra arrivo', confirmLabel: 'Sì, registra arrivo', tone: 'primary',
  },
  [BookingStatus.COMPLETED]: {
    target: BookingStatus.COMPLETED, label: 'Concludi soggiorno', confirmLabel: 'Sì, concludi', tone: 'primary',
  },
  [BookingStatus.NO_SHOW]: {
    target: BookingStatus.NO_SHOW, label: 'Non presentato', confirmLabel: 'Sì, registra', tone: 'secondary',
  },
  [BookingStatus.CANCELLED]: {
    target: BookingStatus.CANCELLED, label: 'Annulla prenotazione', confirmLabel: 'Sì, annulla', tone: 'danger',
  },
};

/** Azioni da mostrare per lo stato attuale, nell'ordine di `ADMIN_TRANSITIONS`. */
export function availableActions(status: BookingStatus): StatusAction[] {
  return ADMIN_TRANSITIONS[status]
    .map(target => STATUS_ACTIONS[target])
    .filter((action): action is StatusAction => !!action);
}

/** Partenza anticipata: il soggiorno si conclude prima della data di partenza. */
function isEarlyDeparture(booking: TransitionContext, target: BookingStatus, today: string): boolean {
  return target === BookingStatus.COMPLETED && today < booking.check_out;
}

/**
 * Perché un'azione ammessa dallo stato non è ancora possibile oggi, oppure
 * `null` se si può eseguire. Anticipa i controlli temporali del backend
 * (`_assert_status_change_is_coherent`): il pulsante si mostra disabilitato
 * con la spiegazione invece di rispondere `409` al clic.
 */
export function blockedReason(
  booking: TransitionContext,
  target: BookingStatus,
  today: string
): string | null {
  switch (target) {
    case BookingStatus.CHECKED_IN:
      return today < booking.check_in
        ? `Disponibile dal giorno di arrivo (${formatStayDate(booking.check_in)})`
        : null;
    case BookingStatus.NO_SHOW:
    case BookingStatus.COMPLETED:
      return today <= booking.check_in
        ? `Disponibile dal giorno dopo l'arrivo (${formatStayDate(booking.check_in)})`
        : null;
    default:
      return null;
  }
}

/**
 * Motivazione obbligatoria: per l'annullamento sempre (lo impone lo schema
 * del backend) e per la partenza anticipata (`_assert_reason_when_required`).
 */
export function isReasonRequired(booking: TransitionContext, target: BookingStatus, today: string): boolean {
  return target === BookingStatus.CANCELLED || isEarlyDeparture(booking, target, today);
}

/**
 * Cosa succederà, mostrato nella conferma prima di eseguire l'azione: chi
 * clicca deve sapere se l'ospite riceverà un'email e cosa accade alle camere.
 */
export function actionConsequence(booking: TransitionContext, target: BookingStatus, today: string): string {
  switch (target) {
    case BookingStatus.CONFIRMED:
      return booking.check_in > today
        ? "L'ospite riceverà il riepilogo con il link per consultare o annullare la prenotazione. Il link di conferma che ha già ricevuto non servirà più."
        : "L'ospite riceverà il riepilogo, senza link di gestione perché il soggiorno è già iniziato. Il link di conferma che ha già ricevuto non servirà più.";
    case BookingStatus.CHECKED_IN:
      return "L'ospite risulterà arrivato. Nessuna email all'ospite.";
    case BookingStatus.COMPLETED:
      return "Il soggiorno risulterà concluso e lo stato non sarà più modificabile. Nessuna email all'ospite.";
    case BookingStatus.NO_SHOW:
      return "L'ospite risulterà non presentato e le camere torneranno libere, anche per le notti rimaste. Lo stato non sarà più modificabile. Nessuna email all'ospite.";
    case BookingStatus.CANCELLED:
      return "Le camere tornano subito prenotabili e l'ospite riceverà un'email di annullamento da parte della struttura. L'operazione non si può annullare.";
    default:
      return '';
  }
}

/** Avvisi per i casi delicati, mostrati nella conferma sotto le conseguenze. */
export function actionWarnings(booking: TransitionContext, target: BookingStatus, today: string): string[] {
  if (isEarlyDeparture(booking, target, today)) {
    return [
      `Stai concludendo il soggiorno prima della partenza prevista (${formatStayDate(booking.check_out)}): ` +
      'le notti rimanenti restano occupate e il prezzo non cambia.',
    ];
  }
  if (target !== BookingStatus.CANCELLED) return [];

  const warnings: string[] = [];
  if (booking.payment_status === PaymentStatus.PAID) {
    warnings.push("Risulta pagata: l'annullamento non registra il rimborso, va registrato a parte.");
  }
  if (booking.payment_option === PaymentOption.PAY_NOW) {
    warnings.push('Tariffa con pagamento anticipato: non rimborsabile.');
  }
  if (booking.check_in <= today) {
    warnings.push(booking.check_in === today
      ? "L'arrivo è previsto per oggi."
      : `L'arrivo era previsto il ${formatStayDate(booking.check_in)}: il soggiorno risulterebbe già iniziato.`);
  }
  return warnings;
}

/**
 * Spiegazione sotto i pulsanti, per gli stati che non ne hanno o ne hanno
 * meno di quanto ci si aspetterebbe. Per le prenotazioni in attesa dice
 * **l'ora** entro cui l'ospite deve agire, non un generico «blocco».
 * `null` se non serve spiegare nulla.
 */
export function noActionsNote(booking: TransitionContext, now: Date = new Date()): string | null {
  switch (booking.status) {
    case BookingStatus.PENDING_CONFIRMATION:
      return pendingNote(booking.hold_expires_at, now, 'confermare', '');
    case BookingStatus.PENDING_PAYMENT:
      return pendingNote(
        booking.hold_expires_at, now, 'pagare',
        "Si conferma solo con il pagamento online dell'ospite. "
      );
    case BookingStatus.COMPLETED:
    case BookingStatus.CANCELLED:
    case BookingStatus.EXPIRED:
    case BookingStatus.NO_SHOW:
      return 'Stato definitivo: nessuna azione disponibile.';
    default:
      return null;
  }
}

function pendingNote(holdExpiresAt: string | null, now: Date, verb: string, prefix: string): string {
  if (!holdExpiresAt) {
    return `${prefix}Se l'ospite non agisce in tempo, la prenotazione scade da sola e le camere tornano libere.`;
  }
  const deadline = describeDeadline(holdExpiresAt, now);
  return deadline.isPast
    ? `${prefix}Il tempo per ${verb} è finito alle ${deadline.when.replace(/^le /, '')}: ` +
      'le camere sono già di nuovo prenotabili e a breve la prenotazione risulterà Scaduta.'
    : `${prefix}Se l'ospite non riesce a ${verb} entro ${deadline.when} (${deadline.remaining}), ` +
      'la prenotazione scade da sola e le camere tornano libere. Per liberarle subito, annullala.';
}
