/**
 * Operazioni sul pagamento che l'amministratore può registrare dalla scheda:
 * incasso, rimborso e correzione di un incasso registrato per errore.
 *
 * Specchio di `_assert_manual_payment_allowed` e di
 * `AdminPaymentRegistrationSchema` del backend. Come per i cambi di stato
 * (`booking-transitions.ts`), il backend resta l'unica fonte di verità: qui
 * si decide solo quali pulsanti mostrare e cosa dire. Una regola che
 * divergesse produrrebbe al massimo un errore gestito.
 */
import {BookingStatus, PaymentMethod, PaymentOption, PaymentStatus} from './booking-enums';
import {StatusActionTone} from './booking-transitions';

/** Lunghezza massima della motivazione — `AdminPaymentRegistrationSchema.reason`. */
export const PAYMENT_REASON_MAX_LENGTH = 500;

/** Metodi registrabili dal back-office, nell'ordine in cui compaiono. */
export const MANUAL_PAYMENT_METHODS: readonly PaymentMethod[] = [
  PaymentMethod.CASH_ON_SITE,
  PaymentMethod.POS_ON_SITE,
  PaymentMethod.BANK_TRANSFER,
];

/** Il metodo dentro una frase: «pagata in contanti», «con POS», «con bonifico». */
const METHOD_IN_SENTENCE: Readonly<Partial<Record<PaymentMethod, string>>> = {
  [PaymentMethod.CASH_ON_SITE]: 'in contanti',
  [PaymentMethod.POS_ON_SITE]: 'con POS',
  [PaymentMethod.BANK_TRANSFER]: 'con bonifico',
};

/** Un'operazione sul pagamento: lo stato del pagamento a cui porta. */
export interface PaymentAction {
  target: PaymentStatus;
  label: string;
  confirmLabel: string;
  tone: StatusActionTone;
  /** Si sceglie il metodo nella conferma (incasso e rimborso). */
  asksMethod: boolean;
  /** Il metodo è obbligatorio (solo l'incasso). */
  methodRequired: boolean;
  /** Motivazione obbligatoria (rimborso e correzione). */
  reasonRequired: boolean;
}

/** Richiesta emessa dalla scheda quando l'admin conferma un'operazione sul pagamento. */
export interface PaymentChangeRequest {
  status: PaymentStatus;
  method?: PaymentMethod;
  /** Già ripulita dagli spazi; assente se non è stata scritta. */
  reason?: string;
}

/** Dati della prenotazione che servono a decidere operazioni e testi. */
export interface PaymentContext {
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_option: PaymentOption;
}

/** Stati in cui si può registrare un incasso — `_PAYABLE_ON_SITE_STATUSES`. */
const PAYABLE_ON_SITE: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
]);

const REGISTER: PaymentAction = {
  target: PaymentStatus.PAID,
  label: 'Registra incasso',
  confirmLabel: 'Sì, registra incasso',
  tone: 'primary',
  asksMethod: true,
  methodRequired: true,
  reasonRequired: false,
};

const REFUND: PaymentAction = {
  target: PaymentStatus.REFUNDED,
  label: 'Registra rimborso',
  confirmLabel: 'Sì, registra rimborso',
  tone: 'secondary',
  asksMethod: true,
  methodRequired: false,
  reasonRequired: true,
};

const CORRECT: PaymentAction = {
  target: PaymentStatus.PENDING,
  label: 'Correggi: non ancora pagata',
  confirmLabel: 'Sì, correggi',
  tone: 'secondary',
  asksMethod: false,
  methodRequired: false,
  reasonRequired: true,
};

/** Pagato online: rimborsi e correzioni si fanno da Stripe, e il webhook aggiorna lo stato. */
function isOnlinePayment(booking: PaymentContext): boolean {
  return booking.payment_method === PaymentMethod.STRIPE_CARD;
}

/** Operazioni disponibili ora, nell'ordine in cui compaiono i pulsanti. */
export function availablePaymentActions(booking: PaymentContext): PaymentAction[] {
  if (isOnlinePayment(booking)) return [];

  if (booking.payment_status === PaymentStatus.PAID) return [REFUND, CORRECT];

  return PAYABLE_ON_SITE.has(booking.status) ? [REGISTER] : [];
}

/** Spiegazione sotto i pulsanti del pagamento, o `null` se non serve. */
export function paymentNote(booking: PaymentContext): string | null {
  if (isOnlinePayment(booking)) {
    return 'Pagamento online: rimborsi e correzioni si gestiscono dalla dashboard di Stripe, e lo stato qui si aggiorna da solo.';
  }
  return null;
}

/** Metodo da proporre nella conferma: quello dell'incasso per il rimborso (P5), nessuno per l'incasso. */
export function defaultPaymentMethod(booking: PaymentContext, action: PaymentAction): PaymentMethod | null {
  if (action.target !== PaymentStatus.REFUNDED) return null;
  return booking.payment_method && MANUAL_PAYMENT_METHODS.includes(booking.payment_method)
    ? booking.payment_method
    : null;
}

/** Cosa succederà, mostrato nella conferma. */
export function paymentConsequence(action: PaymentAction, method: PaymentMethod | null): string {
  switch (action.target) {
    case PaymentStatus.PAID:
      return method && METHOD_IN_SENTENCE[method]
        ? `La prenotazione risulterà pagata ${METHOD_IN_SENTENCE[method]}. Nessuna email all'ospite.`
        : "La prenotazione risulterà pagata con il metodo che scegli qui sotto. Nessuna email all'ospite.";
    case PaymentStatus.REFUNDED:
      return "La prenotazione risulterà rimborsata. Il rimborso lo esegui tu: qui lo registri soltanto. Nessuna email all'ospite.";
    case PaymentStatus.PENDING:
      return 'Per un incasso registrato per errore: la prenotazione tornerà da incassare e il metodo verrà tolto.';
    default:
      return '';
  }
}

/** Avvisi per i casi delicati. */
export function paymentWarnings(booking: PaymentContext, action: PaymentAction): string[] {
  const warnings: string[] = [];
  if (action.target === PaymentStatus.REFUNDED && booking.payment_option === PaymentOption.PAY_NOW) {
    warnings.push('Tariffa con pagamento anticipato, non rimborsabile: stai facendo un\'eccezione.');
  }
  if (action.target === PaymentStatus.PAID && booking.status === BookingStatus.NO_SHOW) {
    warnings.push("L'ospite non si è presentato: stai registrando un pagamento ricevuto comunque.");
  }
  return warnings;
}
