import {Injectable, OnDestroy, computed, signal} from '@angular/core';
import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {catchError, EMPTY, finalize, Observable, Subject, switchMap, takeUntil} from 'rxjs';
import {BookingService} from '../../service/booking-service';
import {BookingDetailSchema} from '../../schemas/booking-schema';
import {StatusChangeRequest} from '../../schemas/booking-transitions';
import {PaymentChangeRequest} from '../../schemas/booking-payments';
import {errorMessageOf} from '../../security/interceptor';

/**
 * Scheda di una prenotazione aperta: caricamento, azioni ed errori.
 *
 * Facade condivisa da Elenco e Calendario, che mostrano la stessa scheda
 * (`app-booking-detail`) in contenitori diversi — una riga che si espande, un
 * pannello laterale. La logica sta qui una volta sola; le schermate decidono
 * solo **dove** mostrarla e cosa aggiornare dopo un'azione (`updated$`).
 *
 * Va fornita dalla schermata (`providers: [BookingDetailFacade]`), non dalla
 * radice: ogni schermata ha la sua scheda aperta, e lo stato muore con lei.
 */
@Injectable()
export class BookingDetailFacade implements OnDestroy {
  /** Prenotazione aperta: al massimo una alla volta. */
  readonly openId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  /** Azione (stato o pagamento) in corso sulla prenotazione aperta. */
  readonly isUpdating = signal(false);
  /** Errore dell'ultima azione, mostrato nella scheda accanto ai pulsanti. */
  readonly actionError = signal<string | null>(null);

  /**
   * Dettagli già caricati. Non è una cache di lettura — a ogni apertura si
   * rilegge dal backend — ma permette a un contenitore che si richiude con
   * un'animazione (la riga dell'Elenco) di tenere la scheda finché sparisce.
   */
  private readonly details = signal<ReadonlyMap<string, BookingDetailSchema>>(new Map());

  /** Dettaglio della prenotazione aperta, se già caricato. */
  readonly current = computed(() => {
    const id = this.openId();
    return id ? this.details().get(id) ?? null : null;
  });

  /** Ogni versione ricevuta dopo un'azione o una rilettura: la schermata aggiorna ciò che mostra. */
  private readonly updatedSubject = new Subject<BookingDetailSchema>();
  readonly updated$: Observable<BookingDetailSchema> = this.updatedSubject.asObservable();

  /** Id da caricare, o `null` per chiudere: `switchMap` annulla la richiesta precedente. */
  private readonly load$ = new Subject<string | null>();
  private readonly destroy$ = new Subject<void>();

  constructor(private bookingService: BookingService) {
    this.load$.pipe(
      switchMap(id => {
        if (!id) return EMPTY;

        this.error.set(null);
        this.isLoading.set(true);

        return this.bookingService.getBooking(id).pipe(
          catchError(err => {
            // Solo lo stato HTTP: il messaggio lo mostra l'interceptor globale.
            console.error('Errore nel caricamento della prenotazione:', err?.status);
            this.error.set('Impossibile caricare la prenotazione');
            this.isLoading.set(false);
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(booking => {
      this.store(booking);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updatedSubject.complete();
  }

  // ------------------------------------------------------------------ //
  // Apertura                                                            //
  // ------------------------------------------------------------------ //

  /** Apre la prenotazione e ne carica il dettaglio; riaprire quella aperta non fa nulla. */
  open(id: string): void {
    if (this.openId() === id) return;
    this.openId.set(id);
    this.actionError.set(null);
    this.load$.next(id);
  }

  close(): void {
    if (this.openId() === null) return;
    this.openId.set(null);
    this.error.set(null);
    this.actionError.set(null);
    this.isLoading.set(false);
    this.load$.next(null);
  }

  retry(): void {
    const id = this.openId();
    if (id) this.load$.next(id);
  }

  /** Dimentica i dettagli caricati (es. quando la lista cambia pagina). */
  clear(): void {
    this.details.set(new Map());
  }

  // ------------------------------------------------------------------ //
  // Lettura per prenotazione                                            //
  // ------------------------------------------------------------------ //

  isOpen(id: string): boolean {
    return this.openId() === id;
  }

  /** La scheda c'è se la prenotazione è aperta o è già stata caricata. */
  hasDetail(id: string): boolean {
    return this.isOpen(id) || this.details().has(id);
  }

  detailOf(id: string): BookingDetailSchema | null {
    return this.details().get(id) ?? null;
  }

  /** Caricamento, errori e azioni riguardano solo la prenotazione aperta. */
  isLoadingFor(id: string): boolean {
    return this.isOpen(id) && this.isLoading();
  }

  errorFor(id: string): string | null {
    return this.isOpen(id) ? this.error() : null;
  }

  isUpdatingFor(id: string): boolean {
    return this.isOpen(id) && this.isUpdating();
  }

  actionErrorFor(id: string): string | null {
    return this.isOpen(id) ? this.actionError() : null;
  }

  // ------------------------------------------------------------------ //
  // Azioni                                                              //
  // ------------------------------------------------------------------ //

  /** Cambio di stato confermato nella scheda. */
  changeStatus(change: StatusChangeRequest): void {
    this.run(id => this.bookingService.changeStatus(id, change.status, change.reason));
  }

  /** Incasso, rimborso o correzione confermati nella scheda. */
  registerPayment(change: PaymentChangeRequest): void {
    this.run(id => this.bookingService.registerPayment(id, change.status, change.method, change.reason));
  }

  /**
   * Esegue un'azione sulla prenotazione aperta. La risposta è la prenotazione
   * aggiornata, cronologia compresa: niente da rileggere.
   *
   * Una sola azione alla volta. Su `409` (stato cambiato nel frattempo, da un
   * altro operatore, dalla scadenza automatica o da Stripe) la scheda viene
   * riletta, così mostra lo stato vero insieme al messaggio del backend.
   */
  private run(request: (id: string) => Observable<BookingDetailSchema>): void {
    const id = this.openId();
    if (!id || this.isUpdating()) return;

    this.isUpdating.set(true);
    this.actionError.set(null);

    request(id).pipe(
      finalize(() => this.isUpdating.set(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: booking => this.store(booking, true),
      error: (err: HttpErrorResponse) => {
        // Solo lo stato HTTP: il corpo può contenere dati dell'ospite.
        console.error('Errore nell\'aggiornamento della prenotazione:', err?.status);
        this.actionError.set(errorMessageOf(err));
        if (err.status === HttpStatusCode.Conflict) this.refresh(id);
      },
    });
  }

  /**
   * Rilegge la prenotazione senza mostrare il caricamento: la scheda resta
   * visibile e cambia solo se lo stato è davvero cambiato.
   */
  private refresh(id: string): void {
    this.bookingService.getBooking(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: booking => this.store(booking, true),
      error: err => console.error('Errore nel ricaricare la prenotazione:', err?.status),
    });
  }

  /** Salva la versione ricevuta; `notify` la annuncia alla schermata. */
  private store(booking: BookingDetailSchema, notify = false): void {
    const next = new Map(this.details());
    next.set(booking.id, booking);
    this.details.set(next);
    if (notify) this.updatedSubject.next(booking);
  }
}
