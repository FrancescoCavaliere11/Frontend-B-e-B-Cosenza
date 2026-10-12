import {Component, DestroyRef, ElementRef, OnInit, computed, inject, input, signal} from '@angular/core';
import {MediaAsset} from '../../models/site.models';
import {InViewService} from '../../services/in-view.service';
import {prefersReducedMotion} from '../../utils/media';
import {UI} from '../../i18n/it';

/** Spostamento minimo (px) perché un trascinamento cambi foto. */
const SWIPE_THRESHOLD = 40;

/**
 * Carosello a dissolvenza, senza librerie.
 *
 * - `interactive`: frecce (in hover), punti cliccabili, swipe e tastiera;
 * - `autoplay` (ms): avanza da solo solo mentre è visibile e mai con
 *   «riduci movimento». Le card-link lo usano non interattivo.
 */
@Component({
  selector: 'site-carousel',
  standalone: false,
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',
  host: {
    'class': 'carousel',
    '[class.is-interactive]': 'interactive()',
    '[attr.role]': 'interactive() ? "region" : null',
    '[attr.aria-roledescription]': 'interactive() ? "carosello" : null',
    '[attr.aria-label]': 'interactive() ? label() : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '(keydown.arrowleft)': 'interactive() && previous()',
    '(keydown.arrowright)': 'interactive() && next()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class Carousel implements OnInit {
  readonly slides = input.required<ReadonlyArray<MediaAsset>>();
  readonly sizes = input('(max-width: 767px) 100vw, 40vw');
  readonly interactive = input(false);
  readonly autoplay = input(0);
  readonly eager = input(false);
  readonly label = input('Galleria fotografica');
  readonly decorative = input(false);

  protected readonly index = signal(0);
  protected readonly total = computed(() => this.slides().length);
  protected readonly ui = UI.common;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly inView = inject(InViewService);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;

  ngOnInit(): void {
    if (this.autoplay() <= 0 || this.total() < 2 || prefersReducedMotion()) return;
    const stop = this.inView.observe(this.host, visible => (visible ? this.play() : this.pause()), '0px');
    this.destroyRef.onDestroy(() => {
      stop();
      this.pause();
    });
  }

  next(): void {
    this.goTo(this.index() + 1);
  }

  previous(): void {
    this.goTo(this.index() - 1);
  }

  goTo(index: number): void {
    const total = this.total();
    if (total) this.index.set((index + total) % total);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.interactive()) this.pointerStartX = event.clientX;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    const delta = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) this.next();
    else this.previous();
  }

  private play(): void {
    this.pause();
    this.timer = setInterval(() => this.next(), this.autoplay());
  }

  private pause(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
