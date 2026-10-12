import {Injectable, computed, inject, signal} from '@angular/core';
import {SiteApiService} from '../http/site-api.service';
import {RoomSchema} from '../../schemas/room-schema';
import {GENERIC_ROOM_CONTENT, ROOM_PLACEMENTS, ROOMS_CONTENT} from '../content/rooms.content';
import {RoomContent, RoomView} from '../models/site.models';

export type CatalogState = 'idle' | 'loading' | 'ready' | 'preview';

/**
 * Camere del sito: dati vivi dal backend (nome, capienza, prezzo,
 * dotazioni) uniti per NUMERO ai contenuti editoriali (pattern Adapter).
 *
 * - backend raggiungibile → solo le camere abilitate, nell'ordine del numero;
 * - backend irraggiungibile → «anteprima» con i soli contenuti, senza prezzi.
 */
@Injectable({providedIn: 'root'})
export class SiteRoomsService {
  private readonly api = inject(SiteApiService);

  private readonly views = signal<ReadonlyArray<RoomView>>([]);
  readonly state = signal<CatalogState>('idle');
  readonly rooms = this.views.asReadonly();
  readonly isPreview = computed(() => this.state() === 'preview');

  /** Carica una volta; le chiamate successive non rifanno la richiesta. */
  load(): void {
    if (this.state() !== 'idle') return;
    this.state.set('loading');
    this.api.getRooms().subscribe({
      next: rooms => {
        this.views.set(this.fromBackend(rooms));
        this.state.set('ready');
      },
      error: () => {
        this.views.set(ROOMS_CONTENT.map((content, index) => this.toView(content, null, index)));
        this.state.set('preview');
      },
    });
  }

  bySlug(slug: string): RoomView | undefined {
    return this.views().find(room => room.slug === slug);
  }

  byId(id: string): RoomView | undefined {
    return this.views().find(room => room.id === id);
  }

  private fromBackend(rooms: RoomSchema[]): RoomView[] {
    return rooms
      .filter(room => room.enabled)
      .sort((a, b) => a.number - b.number)
      .map((room, index) => this.toView(this.contentFor(room), room, index));
  }

  private contentFor(room: RoomSchema): RoomContent {
    return ROOMS_CONTENT.find(content => content.number === room.number) ?? {
      ...GENERIC_ROOM_CONTENT,
      number: room.number,
      slug: `camera-${room.number}`,
      name: room.name,
    };
  }

  private toView(content: RoomContent, room: RoomSchema | null, index: number): RoomView {
    return {
      ...content,
      name: room?.name ?? content.name,
      id: room?.id ?? null,
      capacity: room?.capacity ?? null,
      price: room ? String(room.price) : null,
      amenities: room?.services.map(service => service.name) ?? [],
      placement: ROOM_PLACEMENTS[index % ROOM_PLACEMENTS.length],
    };
  }
}
