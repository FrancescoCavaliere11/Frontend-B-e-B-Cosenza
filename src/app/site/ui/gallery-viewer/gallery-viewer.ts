import {Component, OnDestroy, OnInit, computed, inject, input, output, signal} from '@angular/core';
import {MediaAsset} from '../../models/site.models';
import {ScrollLockService} from '../../services/scroll-lock.service';
import {UI} from '../../i18n/it';
import {cssDurationMs} from '../../utils/media';

const LOCK_OWNER = 'gallery-viewer';
const SWIPE_THRESHOLD = 50;

/**
 * Visore a schermo intero: una foto alla volta nelle sue proporzioni
 * originali, contatore, didascalia, frecce, swipe ed Esc.
 */
@Component({
  selector: 'site-gallery-viewer',
  standalone: false,
  templateUrl: './gallery-viewer.html',
  styleUrl: './gallery-viewer.css',
  host: {
    'class': 'viewer',
    'role': 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': 'label()',
    '[class.is-open]': 'isOpen()',
    '(document:keydown.escape)': 'close()',
    '(document:keydown.arrowleft)': 'step(-1)',
    '(document:keydown.arrowright)': 'step(1)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class GalleryViewer implements OnInit, OnDestroy {
  readonly items = input.required<ReadonlyArray<MediaAsset>>();
  readonly startIndex = input(0);
  readonly label = input('Galleria');
  readonly closed = output<void>();

  protected readonly ui = UI.common;
  protected readonly index = signal(0);
  protected readonly isOpen = signal(false);
  protected readonly current = computed(() => this.items()[this.index()]);

  private readonly scrollLock = inject(ScrollLockService);
  private pointerStartX: number | null = null;

  ngOnInit(): void {
    this.index.set(this.startIndex());
    this.scrollLock.lock(LOCK_OWNER);
    requestAnimationFrame(() => this.isOpen.set(true));
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock(LOCK_OWNER);
  }

  step(direction: 1 | -1): void {
    const total = this.items().length;
    this.index.set((this.index() + direction + total) % total);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    setTimeout(() => this.closed.emit(), cssDurationMs('--dur-fade', 500));
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    const delta = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) this.step(delta < 0 ? 1 : -1);
  }
}
