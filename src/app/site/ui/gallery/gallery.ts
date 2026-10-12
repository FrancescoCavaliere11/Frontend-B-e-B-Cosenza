import {Component, ElementRef, computed, input, signal, viewChild} from '@angular/core';
import {MediaAsset} from '../../models/site.models';
import {UI} from '../../i18n/it';

/** Sotto questo spostamento un trascinamento resta un clic. */
const DRAG_CLICK_TOLERANCE = 6;

/**
 * Galleria «percorribile»: una striscia di foto a tutta altezza da
 * scorrere col dito, col trackpad, trascinando col mouse o con le frecce.
 * Un clic su una foto apre il visore a schermo intero.
 */
@Component({
  selector: 'site-gallery',
  standalone: false,
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  readonly items = input.required<ReadonlyArray<MediaAsset>>();
  readonly label = input.required<string>();

  protected readonly ui = UI;
  protected readonly progress = signal(0);
  protected readonly viewerIndex = signal<number | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly canScroll = computed(() => this.items().length > 1);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private drag: {startX: number; scrollLeft: number; moved: number} | null = null;

  protected scrollByItem(direction: 1 | -1): void {
    const track = this.track().nativeElement;
    const item = track.querySelector<HTMLElement>('.gallery__item');
    const step = item ? item.offsetWidth : track.clientWidth * 0.8;
    track.scrollBy({left: step * direction, behavior: 'smooth'});
  }

  protected onScroll(): void {
    const track = this.track().nativeElement;
    const max = track.scrollWidth - track.clientWidth;
    this.progress.set(max > 0 ? track.scrollLeft / max : 0);
  }

  /** Trascinamento col mouse (al tocco e al trackpad pensa il browser). */
  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const track = this.track().nativeElement;
    this.drag = {startX: event.clientX, scrollLeft: track.scrollLeft, moved: 0};
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag) return;
    const delta = event.clientX - this.drag.startX;
    this.drag.moved = Math.max(this.drag.moved, Math.abs(delta));
    if (this.drag.moved > DRAG_CLICK_TOLERANCE) this.isDragging.set(true);
    this.track().nativeElement.scrollLeft = this.drag.scrollLeft - delta;
  }

  protected onPointerUp(): void {
    this.drag = null;
    // Lascia passare il clic che chiude il trascinamento prima di riattivarli.
    setTimeout(() => this.isDragging.set(false));
  }

  protected open(index: number): void {
    if (!this.isDragging()) this.viewerIndex.set(index);
  }
}
