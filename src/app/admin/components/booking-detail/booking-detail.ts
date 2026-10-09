import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, Validators} from '@angular/forms';
import {Cancel01Icon} from '@hugeicons/core-free-icons';
import {BookingDetailSchema} from '../../../schemas/booking-schema';
import {
  AUDIT_ACTOR_LABELS,
  BOOKING_CHANNEL_LABELS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONES,
  BookingStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_OPTION_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  PaymentMethod,
  visiblePaymentStatus,
} from '../../../schemas/booking-enums';
import {
  actionConsequence,
  actionWarnings,
  availableActions,
  blockedReason,
  isReasonRequired,
  noActionsNote,
  STATUS_REASON_MAX_LENGTH,
  StatusAction,
  StatusChangeRequest,
} from '../../../schemas/booking-transitions';
import {
  availablePaymentActions,
  defaultPaymentMethod,
  MANUAL_PAYMENT_METHODS,
  PAYMENT_REASON_MAX_LENGTH,
  PaymentAction,
  PaymentChangeRequest,
  paymentConsequence,
  paymentNote,
  paymentWarnings,
} from '../../../schemas/booking-payments';
import {formatAmount, formatInstant, formatStayDate, todayIso} from '../../../utils/booking-format';

/** Stati in cui la prenotazione occupa ancora le camere in modo provvisorio. */
const PENDING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.PENDING_CONFIRMATION,
  BookingStatus.PENDING_PAYMENT,
]);

/** Stati in cui ha ancora senso la scadenza dell'annullamento gratuito. */
const CANCELLABLE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  ...PENDING_STATUSES,
  BookingStatus.CONFIRMED,
]);

/** Ogni quanto si aggiorna il tempo rimasto mostrato per le prenotazioni in attesa. */
const COUNTDOWN_REFRESH_MS = 30_000;

/** Pulsante della sezione «Azioni», con l'eventuale motivo per cui è disabilitato. */
interface ActionButton {
  action: StatusAction;
  blocked: string | null;
}

/**
 * Azione in attesa di conferma: un cambio di stato della prenotazione o
 * un'operazione sul pagamento. Stessa conferma, stessa animazione, stesso
 * campo motivazione; cambiano le regole e l'evento emesso.
 */
type ConfirmTarget =
  | { kind: 'status'; action: StatusAction }
  | { kind: 'payment'; action: PaymentAction };

/** Voce della cronologia unica: stati della prenotazione e pagamenti, in ordine di tempo. */
interface TimelineEntry {
  kind: 'status' | 'payment';
  createdAt: string;
  actor: string;
  /** Stato di partenza già tradotto; vuoto quando non c'è. */
  from: string;
  to: string;
  method: string | null;
  reason: string | null;
}

/** Riga «etichetta → valore» della sezione date. */
interface KeyDate {
  label: string;
  value: string;
}

/**
 * Scheda di dettaglio di una prenotazione, mostrata dentro la riga aperta
 * dell'elenco.
 *
 * Solo presentazione: non chiama il backend. Caricamento, errore e nuovo
 * tentativo li governa la schermata che la ospita.
 *
 * La sezione «Azioni» mostra i cambi di stato ammessi (`booking-transitions.ts`)
 * e, nel gruppo «Pagamento», le operazioni sul pagamento (`booking-payments.ts`).
 * Ogni azione chiede una conferma, con conseguenze, avvisi, motivazione e —
 * per incasso e rimborso — il metodo, prima di emettere `statusChange` o
 * `paymentChange`: è la schermata a chiamare il backend e a restituire la
 * prenotazione aggiornata o l'errore. Pulsanti e conferma si scambiano il
 * posto con un'animazione (booking-detail.css).
 */
@Component({
  selector: 'app-booking-detail',
  standalone: false,
  templateUrl: './booking-detail.html',
  styleUrls: [
    './booking-detail.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/badge.css',
  ],
})
export class BookingDetail {
  /** Intestazione disponibile subito, dalla riga dell'elenco. */
  headline = input<string>('');
  code = input<string>('');

  booking = input<BookingDetailSchema | null>(null);
  isLoading = input<boolean>(false);
  error = input<string | null>(null);

  /** Un'azione (stato o pagamento) è in corso di salvataggio. */
  isUpdating = input<boolean>(false);
  /** Errore dell'ultima azione, mostrato accanto ai pulsanti. */
  actionError = input<string | null>(null);

  close = output<void>();
  retry = output<void>();
  statusChange = output<StatusChangeRequest>();
  paymentChange = output<PaymentChangeRequest>();

  protected readonly Cancel01Icon = Cancel01Icon;
  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly statusTones = BOOKING_STATUS_TONES;
  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly paymentTones = PAYMENT_STATUS_TONES;
  protected readonly paymentOptionLabels = PAYMENT_OPTION_LABELS;
  protected readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected readonly manualPaymentMethods = MANUAL_PAYMENT_METHODS;
  protected readonly channelLabels = BOOKING_CHANNEL_LABELS;
  protected readonly actorLabels = AUDIT_ACTOR_LABELS;
  protected readonly formatAmount = formatAmount;
  protected readonly formatInstant = formatInstant;
  protected readonly formatStayDate = formatStayDate;
  /** Stesso limite per le due motivazioni (stato e pagamento). */
  protected readonly reasonMaxLength = Math.min(STATUS_REASON_MAX_LENGTH, PAYMENT_REASON_MAX_LENGTH);

  private readonly injector = inject(Injector);
  private readonly reasonInput = viewChild<ElementRef<HTMLTextAreaElement>>('reasonInput');

  /** Azione in attesa di conferma, o `null`: decide quale vista è aperta. */
  protected readonly pending = signal<ConfirmTarget | null>(null);
  /**
   * Ultima azione mostrata nella conferma. A differenza di `pending` non
   * torna `null` alla chiusura: la conferma resta leggibile mentre si
   * richiude con l'animazione, invece di svuotarsi di colpo.
   */
  protected readonly shown = signal<ConfirmTarget | null>(null);
  protected readonly isConfirming = computed(() => this.pending() !== null);

  protected readonly reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(this.reasonMaxLength)],
  });
  private readonly reasonValue = toSignal(this.reasonControl.valueChanges, {initialValue: ''});
  protected readonly reasonLength = computed(() => this.reasonValue().length);
  private readonly trimmedReason = computed(() => this.reasonValue().trim());

  /** Metodo di incasso o rimborso scelto nella conferma; `''` = nessuno. */
  protected readonly methodControl = new FormControl<PaymentMethod | ''>('', {nonNullable: true});
  private readonly methodValue = toSignal(this.methodControl.valueChanges, {initialValue: '' as PaymentMethod | ''});

  /** Adesso, aggiornato periodicamente finché la prenotazione è in attesa (tempo rimasto). */
  private readonly now = signal(new Date());

  /** Oggi nel fuso della struttura, ricalcolato a ogni nuova versione della prenotazione. */
  private readonly today = computed(() => {
    this.booking();
    this.now();
    return todayIso();
  });

  protected readonly actions = computed<ActionButton[]>(() => {
    const booking = this.booking();
    if (!booking) return [];
    const today = this.today();
    return availableActions(booking.status).map(action => ({
      action,
      blocked: blockedReason(booking, action.target, today),
    }));
  });

  protected readonly blockedActions = computed(() => this.actions().filter(item => item.blocked));

  protected readonly actionsNote = computed(() => {
    const booking = this.booking();
    return booking ? noActionsNote(booking, this.now()) : null;
  });

  protected readonly paymentActions = computed<PaymentAction[]>(() => {
    const booking = this.booking();
    return booking ? availablePaymentActions(booking) : [];
  });

  protected readonly paymentNoteText = computed(() => {
    const booking = this.booking();
    return booking ? paymentNote(booking) : null;
  });

  protected readonly hasPaymentGroup = computed(() =>
    this.paymentActions().length > 0 || !!this.paymentNoteText()
  );

  protected readonly hasActionsSection = computed(() =>
    this.actions().length > 0 || !!this.actionsNote() || this.hasPaymentGroup()
  );

  /** Il metodo scelto, o `null`. */
  private readonly selectedMethod = computed<PaymentMethod | null>(() => this.methodValue() || null);

  protected readonly consequence = computed(() => {
    const booking = this.booking();
    const target = this.shown();
    if (!booking || !target) return '';
    return target.kind === 'status'
      ? actionConsequence(booking, target.action.target, this.today())
      : paymentConsequence(target.action, this.selectedMethod());
  });

  protected readonly warnings = computed(() => {
    const booking = this.booking();
    const target = this.shown();
    if (!booking || !target) return [];
    return target.kind === 'status'
      ? actionWarnings(booking, target.action.target, this.today())
      : paymentWarnings(booking, target.action);
  });

  protected readonly reasonRequired = computed(() => {
    const booking = this.booking();
    const target = this.shown();
    if (!booking || !target) return false;
    return target.kind === 'status'
      ? isReasonRequired(booking, target.action.target, this.today())
      : target.action.reasonRequired;
  });

  /** La conferma chiede il metodo (incasso e rimborso). */
  protected readonly asksMethod = computed(() => {
    const target = this.shown();
    return target?.kind === 'payment' && target.action.asksMethod;
  });

  private readonly methodRequired = computed(() => {
    const target = this.shown();
    return target?.kind === 'payment' && target.action.methodRequired;
  });

  protected readonly canConfirm = computed(() => {
    if (!this.pending() || this.isUpdating()) return false;
    if (this.reasonLength() > this.reasonMaxLength) return false;
    if (this.methodRequired() && !this.selectedMethod()) return false;
    return !this.reasonRequired() || this.trimmedReason().length > 0;
  });

  /**
   * Cronologia unica: cambi di stato della prenotazione e del pagamento,
   * dal più vecchio. A parità di istante (stessa transazione, es. un
   * pagamento online che conferma la prenotazione) lo stato viene prima.
   */
  protected readonly timeline = computed<TimelineEntry[]>(() => {
    const booking = this.booking();
    if (!booking) return [];

    const entries: TimelineEntry[] = [
      ...booking.status_history.map(entry => ({
        kind: 'status' as const,
        createdAt: entry.created_at,
        actor: this.actorLabels[entry.actor_type],
        from: entry.from_status ? this.statusLabels[entry.from_status] : 'Creata',
        to: this.statusLabels[entry.to_status],
        method: null,
        reason: entry.reason,
      })),
      ...booking.payment_history.map(entry => ({
        kind: 'payment' as const,
        createdAt: entry.created_at,
        actor: this.actorLabels[entry.actor_type],
        from: entry.from_status ? this.paymentLabels[entry.from_status] : '',
        to: this.paymentLabels[entry.to_status],
        method: entry.payment_method ? this.paymentMethodLabels[entry.payment_method] : null,
        reason: entry.reason,
      })),
    ];
    // `sort` è stabile: a parità di istante resta l'ordine di partenza (stati prima).
    return entries.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  });

  constructor() {
    // Una nuova versione della prenotazione (azione riuscita, o riletta dopo
    // un conflitto) chiude la conferma: l'azione chiesta potrebbe non avere
    // più senso nel nuovo stato.
    effect(() => {
      this.booking();
      untracked(() => this.resetConfirmation());
    });

    // Il tempo rimasto («tra 12 minuti») si aggiorna da solo finché serve.
    effect(onCleanup => {
      const status = this.booking()?.status;
      if (!status || !PENDING_STATUSES.has(status)) return;

      this.now.set(new Date());
      const timer = setInterval(() => this.now.set(new Date()), COUNTDOWN_REFRESH_MS);
      onCleanup(() => clearInterval(timer));
    });
  }

  /** Badge del pagamento, o `null` se va nascosto (vedi `visiblePaymentStatus`). */
  protected readonly paymentBadge = computed(() => {
    const booking = this.booking();
    return booking ? visiblePaymentStatus(booking.status, booking.payment_status) : null;
  });

  protected readonly hasDiscount = computed(() => Number(this.booking()?.discount_amount ?? 0) > 0);

  /** Solo le date valorizzate e pertinenti allo stato attuale. */
  protected readonly keyDates = computed<KeyDate[]>(() => {
    const booking = this.booking();
    if (!booking) return [];

    const dates: Array<KeyDate | null> = [
      {label: 'Creata il', value: formatInstant(booking.created_at)},
      booking.confirmed_at
        ? {label: 'Confermata il', value: formatInstant(booking.confirmed_at)}
        : null,
      booking.hold_expires_at && PENDING_STATUSES.has(booking.status)
        ? {
          label: booking.status === BookingStatus.PENDING_PAYMENT ? 'Da pagare entro' : 'Da confermare entro',
          value: formatInstant(booking.hold_expires_at),
        }
        : null,
      booking.hold_expires_at && booking.status === BookingStatus.EXPIRED
        ? {label: 'Scaduta il', value: formatInstant(booking.hold_expires_at)}
        : null,
      booking.cancellation_deadline && CANCELLABLE_STATUSES.has(booking.status)
        ? {label: 'Annullabile gratis fino a', value: formatInstant(booking.cancellation_deadline)}
        : null,
      booking.cancelled_at
        ? {label: 'Annullata il', value: formatInstant(booking.cancelled_at)}
        : null,
    ];
    return dates.filter((date): date is KeyDate => date !== null);
  });

  protected startAction(action: StatusAction): void {
    this.open({kind: 'status', action});
  }

  protected startPaymentAction(action: PaymentAction): void {
    this.open({kind: 'payment', action});
  }

  private open(target: ConfirmTarget): void {
    const booking = this.booking();
    this.reasonControl.reset('');
    const method = booking && target.kind === 'payment' ? defaultPaymentMethod(booking, target.action) : null;
    this.methodControl.reset(method ?? '');
    this.shown.set(target);
    this.pending.set(target);
    afterNextRender(() => this.reasonInput()?.nativeElement.focus(), {injector: this.injector});
  }

  /** «Indietro»: non durante il salvataggio, quando l'esito non è ancora noto. */
  protected cancelAction(): void {
    if (!this.isUpdating()) this.resetConfirmation();
  }

  /** Chiude la conferma; il testo resta (`shown`) per l'animazione di chiusura. */
  private resetConfirmation(): void {
    this.pending.set(null);
    this.reasonControl.markAsUntouched();
    this.methodControl.markAsUntouched();
  }

  protected confirmAction(): void {
    const target = this.pending();
    if (!target) return;
    if (!this.canConfirm()) {
      this.reasonControl.markAsTouched();
      this.methodControl.markAsTouched();
      return;
    }

    const reason = this.trimmedReason();
    if (target.kind === 'status') {
      this.statusChange.emit({status: target.action.target, ...(reason ? {reason} : {})});
      return;
    }

    const method = target.action.asksMethod ? this.selectedMethod() : null;
    this.paymentChange.emit({
      status: target.action.target,
      ...(method ? {method} : {}),
      ...(reason ? {reason} : {}),
    });
  }

  /** Motivazione obbligatoria mancante, mostrata dopo il primo tentativo. */
  protected reasonMissing(): boolean {
    return this.reasonRequired()
      && this.reasonControl.touched
      && this.trimmedReason().length === 0;
  }

  /** Metodo obbligatorio non scelto, mostrato dopo il primo tentativo. */
  protected methodMissing(): boolean {
    return this.methodRequired() && this.methodControl.touched && !this.selectedMethod();
  }

  protected guestName(booking: BookingDetailSchema): string {
    return [booking.guest_firstname, booking.guest_lastname].filter(Boolean).join(' ');
  }

  /** `tel:` senza spazi, che alcuni dispositivi non accettano. */
  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }
}
