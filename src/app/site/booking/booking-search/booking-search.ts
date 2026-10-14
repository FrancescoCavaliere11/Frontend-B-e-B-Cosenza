import {Component, computed, inject} from '@angular/core';
import {BookingFlowStore, SearchMode, SelectableRoom} from '../booking-flow.store';
import {SiteRoomsService} from '../../services/site-rooms.service';
import {StayRange, VisibleRange} from '../../../shared/components/stay-calendar/stay-calendar';
import {BOOKING_RULES} from '../../../schemas/booking-schema';
import {addDaysIso, formatAmount, todayIso} from '../../../utils/booking-format';
import {BOOKING_UI} from '../booking.copy';

/** Una proposta di camere fra cui scegliere (singola o combinazione). */
interface Proposal {
  key: string;
  ids: string[];
  title: string;
  detail: string;
}

/** Passo 1: date, ospiti e camere, nelle due modalità «per date» e «per camera». */
@Component({
  selector: 'site-booking-search',
  standalone: false,
  templateUrl: './booking-search.html',
  styleUrl: './booking-search.css',
})
export class BookingSearch {
  protected readonly store = inject(BookingFlowStore);
  protected readonly catalog = inject(SiteRoomsService);
  protected readonly ui = BOOKING_UI.search;
  protected readonly modes: ReadonlyArray<SearchMode> = ['dates', 'room'];
  protected readonly today = todayIso();
  protected readonly maxDate = addDaysIso(this.today, BOOKING_RULES.MAX_ADVANCE_DAYS);
  protected readonly maxNights = BOOKING_RULES.MAX_NIGHTS;
  protected readonly maxGuests = BOOKING_RULES.MAX_GUESTS;
  protected readonly formatAmount = formatAmount;

  private readonly noNights: ReadonlySet<string> = new Set();

  protected readonly calendarNights = computed(() => (this.store.mode() === 'room' ? this.store.unavailableNights() : this.noNights));

  /** Camere che da sole ospitano tutti. */
  protected readonly singles = computed<Proposal[]>(() =>
    this.store.rooms().filter(room => room.fitsAll).map(room => this.single(room))
  );

  /** Combinazioni minime suggerite dal backend. */
  protected readonly combinations = computed<Proposal[]>(() => {
    const byId = new Map(this.store.rooms().map(room => [room.id, room]));
    return (this.store.availability()?.suggested_combinations ?? [])
      .filter(combination => combination.rooms_count > 1)
      .map(combination => ({
        key: combination.room_ids.join('+'),
        ids: combination.room_ids,
        title: combination.room_ids.map(id => byId.get(id)?.name ?? '').join(' + '),
        detail: `${this.ui.upTo(combination.total_capacity)} · ${formatAmount(combination.total_price)} ${this.ui.total}`,
      }));
  });

  protected readonly selectionKey = computed(() => [...this.store.selectedIds()].sort().join('+'));

  protected readonly hasResults = computed(() => (this.store.availability()?.rooms.length ?? 0) > 0);

  protected isSelected(proposal: Proposal): boolean {
    return [...proposal.ids].sort().join('+') === this.selectionKey();
  }

  protected isRoomSelected(id: string): boolean {
    return this.store.selectedIds().includes(id);
  }

  protected onRange(range: StayRange): void {
    this.store.setRange(range.checkIn, range.checkOut);
  }

  protected onVisibleRange(range: VisibleRange): void {
    this.store.setVisibleRange(range.from, range.to);
  }

  protected roomDetail(room: SelectableRoom): string {
    const price = room.price ? ` · ${formatAmount(room.price)}${this.store.mode() === 'room' ? ' / notte' : ''}` : '';
    return `${this.ui.upTo(room.capacity)}${price}`;
  }

  private single(room: SelectableRoom): Proposal {
    return {key: room.id, ids: [room.id], title: room.name, detail: this.roomDetail(room)};
  }
}
