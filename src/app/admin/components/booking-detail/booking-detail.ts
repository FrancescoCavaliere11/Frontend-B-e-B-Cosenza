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
import {BookingDetailSchema, BookingStatusHistorySchema} from '../../../schemas/booking-schema';
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
 * e chiede sempre una conferma, con le conseguenze e gli avvisi dell'azione,
 * prima di emettere `statusChange`: è la schermata a chiamare il backend e a
 * restituire la prenotazione aggiornata o l'errore. Pulsanti e conferma si
 * scambiano il posto con un'animazione (booking-detail.css).
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

  /** Un cambio di stato è in corso. */
  isUpdating = input<boolean>(false);
  /** Errore dell'ultimo cambio di stato, mostrato accanto ai pulsanti. */
  actionError = input<string | null>(null);

  close = output<void>();
  retry = output<void>();
  statusChange = output<StatusChangeRequest>();

  protected readonly Cancel01Icon = Cancel01Icon;
  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly statusTones = BOOKING_STATUS_TONES;
  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly paymentTones = PAYMENT_STATUS_TONES;
  protected readonly paymentOptionLabels = PAYMENT_OPTION_LABELS;
  protected readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected readonly channelLabels = BOOKING_CHANNEL_LABELS;
  protected readonly actorLabels = AUDIT_ACTOR_LABELS;
  protected readonly formatAmount = formatAmount;
  protected readonly formatInstant = formatInstant;
  protected readonly formatStayDate = formatStayDate;
  protected readonly reasonMaxLength = STATUS_REASON_MAX_LENGTH;

  private readonly injector = inject(Injector);
  private readonly reasonInput = viewChild<ElementRef<HTMLTextAreaElement>>('reasonInput');

  /** Azione in attesa di conferma, o `null`: decide quale vista è aperta. */
  protected readonly pendingAction = signal<StatusAction | null>(null);
  /**
   * Ultima azione mostrata nella conferma. A differenza di `pendingAction`
   * non torna `null` alla chiusura: la conferma resta leggibile mentre si
   * richiude con l'animazione, invece di svuotarsi di colpo.
   */
  protected readonly shownAction = signal<StatusAction | null>(null);
  protected readonly isConfirming = computed(() => this.pendingAction() !== null);
  protected readonly reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(STATUS_REASON_MAX_LENGTH)],
  });
  private readonly reasonValue = toSignal(this.reasonControl.valueChanges, {initialValue: ''});
  protected readonly reasonLength = computed(() => this.reasonValue().length);
  private readonly trimmedReason = computed(() => this.reasonValue().trim());

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

  protected readonly consequence = computed(() => {
    const booking = this.booking();
    const action = this.shownAction();
    return booking && action ? actionConsequence(booking, action.target, this.today()) : '';
  });

  protected readonly warnings = computed(() => {
    const booking = this.booking();
    const action = this.shownAction();
    return booking && action ? actionWarnings(booking, action.target, this.today()) : [];
  });

  protected readonly reasonRequired = computed(() => {
    const booking = this.booking();
    const action = this.shownAction();
    return !!booking && !!action && isReasonRequired(booking, action.target, this.today());
  });

  protected readonly canConfirm = computed(() => {
    if (!this.pendingAction() || this.isUpdating()) return false;
    if (this.reasonLength() > STATUS_REASON_MAX_LENGTH) return false;
    return !this.reasonRequired() || this.trimmedReason().length > 0;
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
    this.reasonControl.reset('');
    this.shownAction.set(action);
    this.pendingAction.set(action);
    afterNextRender(() => this.reasonInput()?.nativeElement.focus(), {injector: this.injector});
  }

  /** «Indietro»: non durante il salvataggio, quando l'esito non è ancora noto. */
  protected cancelAction(): void {
    if (!this.isUpdating()) this.resetConfirmation();
  }

  /** Chiude la conferma; il testo resta (`shownAction`) per l'animazione di chiusura. */
  private resetConfirmation(): void {
    this.pendingAction.set(null);
    this.reasonControl.markAsUntouched();
  }

  protected confirmAction(): void {
    const action = this.pendingAction();
    if (!action) return;
    if (!this.canConfirm()) {
      this.reasonControl.markAsTouched();
      return;
    }
    const reason = this.trimmedReason();
    this.statusChange.emit({status: action.target, ...(reason ? {reason} : {})});
  }

  /** Motivazione obbligatoria mancante, mostrata dopo il primo tentativo. */
  protected reasonMissing(): boolean {
    return this.reasonRequired()
      && this.reasonControl.touched
      && this.trimmedReason().length === 0;
  }

  protected guestName(booking: BookingDetailSchema): string {
    return [booking.guest_firstname, booking.guest_lastname].filter(Boolean).join(' ');
  }

  /** `tel:` senza spazi, che alcuni dispositivi non accettano. */
  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  /** «Creata» per la prima voce, altrimenti lo stato di partenza. */
  protected historyFrom(entry: BookingStatusHistorySchema): string {
    return entry.from_status ? this.statusLabels[entry.from_status] : 'Creata';
  }
}
