import {Injectable, computed, inject, signal} from '@angular/core';
import {SiteApiService} from '../http/site-api.service';
import {RoomSchema} from '../../schemas/room-schema';
import {DEFAULT_ROOM_GALLERY, ROOM_GALLERIES, ROOM_PLACEMENTS} from '../content/rooms.content';
import {RoomView} from '../models/site.models';

export type CatalogState = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Camere del sito, solo dal backend: nome, descrizione, capienza, prezzo e
 * servizi sono quelli inseriti dall'admin. Dal frontend si aggiungono le
 * foto (per numero) e la posizione nella griglia (pattern Adapter).
 * Se il backend non risponde non si inventa nulla: l'elenco resta vuoto.
 */
@Injectable({providedIn: 'root'})
export class SiteRoomsService {
  private readonly api = inject(SiteApiService);

  private readonly views = signal<ReadonlyArray<RoomView>>([]);
  readonly state = signal<CatalogState>('idle');
  readonly rooms = this.views.asReadonly();
  readonly isUnavailable = computed(() => this.state() === 'unavailable');

  /** Carica una volta; un nuovo tentativo solo dopo un errore. */
  load(): void {
    if (this.state() === 'loading' || this.state() === 'ready') return;
    this.state.set('loading');
    this.api.getRooms().subscribe({
      next: rooms => {
        this.views.set(this.toViews(rooms));
        this.state.set('ready');
      },
      error: () => this.state.set('unavailable'),
    });
  }

  bySlug(slug: string): RoomView | undefined {
    return this.views().find(room => room.slug === slug);
  }

  private toViews(rooms: RoomSchema[]): RoomView[] {
    const slugs = new Set<string>();
    return rooms
      .filter(room => room.enabled)
      .sort((a, b) => a.number - b.number)
      .map((room, index) => {
        const slug = uniqueSlug(room, slugs);
        return {
          id: room.id,
          number: room.number,
          slug,
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          price: String(room.price),
          amenities: room.services.map(service => service.name),
          gallery: ROOM_GALLERIES[room.number] ?? DEFAULT_ROOM_GALLERY,
          placement: ROOM_PLACEMENTS[index % ROOM_PLACEMENTS.length],
        };
      });
  }
}

/** `Suite Sila` → `suite-sila`; in caso di doppione si aggiunge il numero. */
function uniqueSlug(room: RoomSchema, taken: Set<string>): string {
  const base = room.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'camera';
  const slug = taken.has(base) ? `${base}-${room.number}` : base;
  taken.add(slug);
  return slug;
}
