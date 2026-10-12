import {Component, OnInit, computed, effect, inject, output, viewChild} from '@angular/core';
import {BookingFlowStore, BookingStep} from '../booking-flow.store';
import {BookingPanelService} from '../../services/booking-panel.service';
import {SiteRoomsService} from '../../services/site-rooms.service';
import {OverlayPanel} from '../../ui/overlay-panel/overlay-panel';
import {BOOKING_UI} from '../booking.copy';

const STEP_INDEX: Readonly<Record<BookingStep, number>> = {search: 0, summary: 1, guest: 2, payment: 3, done: 3};

/** Pannello di prenotazione: contenitore dei passi e del loro stato. */
@Component({
  selector: 'site-booking-panel',
  standalone: false,
  templateUrl: './booking-panel.html',
  styleUrl: './booking-panel.css',
  providers: [BookingFlowStore],
})
export class BookingPanel implements OnInit {
  readonly closed = output<void>();

  protected readonly store = inject(BookingFlowStore);
  protected readonly ui = BOOKING_UI;
  protected readonly stepIndex = computed(() => STEP_INDEX[this.store.step()]);

  private readonly panel = inject(BookingPanelService);
  private readonly catalog = inject(SiteRoomsService);
  private readonly overlay = viewChild.required(OverlayPanel);

  constructor() {
    // A ogni cambio di passo si riparte dall'alto del pannello.
    effect(() => {
      this.store.step();
      queueMicrotask(() => this.overlay().scrollToTop());
    });
  }

  ngOnInit(): void {
    this.catalog.load();
    const roomId = this.panel.preset()?.roomId;
    if (roomId) this.store.presetRoom(roomId);
  }

  protected close(): void {
    this.overlay().close();
  }
}
