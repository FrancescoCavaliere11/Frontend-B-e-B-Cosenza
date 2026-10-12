import {Component, ElementRef, OnDestroy, OnInit, inject, input, output, signal, viewChild} from '@angular/core';
import {ScrollLockService} from '../../services/scroll-lock.service';
import {cssDurationMs} from '../../utils/media';
import {UI} from '../../i18n/it';

let nextOwnerId = 0;

/**
 * Pannello che sale dal basso sopra la pagina (racconti, schede camera,
 * prenotazione). L'indice resta montato sotto; chiusura animata, Esc,
 * clic sul velo, focus intrappolato, scroll della pagina bloccato.
 * Con `coverTitle` mostra prima il titolo gigante, che poi sfuma.
 */
@Component({
  selector: 'site-overlay-panel',
  standalone: false,
  templateUrl: './overlay-panel.html',
  styleUrl: './overlay-panel.css',
  host: {
    'class': 'overlay',
    '[class.is-open]': 'isOpen()',
    '[class.is-cover-hidden]': 'coverHidden()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class OverlayPanel implements OnInit, OnDestroy {
  readonly label = input.required<string>();
  readonly coverTitle = input<string | null>(null);
  readonly wide = input(false);
  /** Se falso, Esc non chiude (es. un visore aperto sopra lo gestisce da sé). */
  readonly closeOnEscape = input(true);
  readonly closed = output<void>();

  protected readonly ui = UI.common;
  protected readonly isOpen = signal(false);
  protected readonly coverHidden = signal(false);

  private readonly scrollLock = inject(ScrollLockService);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly owner = `overlay-${nextOwnerId++}`;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.scrollLock.lock(this.owner);
    requestAnimationFrame(() => this.isOpen.set(true));
    const coverDelay = cssDurationMs('--dur-panel', 1000) * 2.2;
    this.timers.push(setTimeout(() => this.coverHidden.set(true), this.coverTitle() ? coverDelay : 0));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.scrollLock.unlock(this.owner);
  }

  /** Riporta il contenuto in cima (cambio di scheda dentro lo stesso pannello). */
  scrollToTop(): void {
    this.content().nativeElement.scrollTo({top: 0, behavior: 'instant'});
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.timers.push(setTimeout(() => this.closed.emit(), cssDurationMs('--dur-fade', 500)));
  }

  protected onEscape(): void {
    if (this.closeOnEscape() && !document.querySelector('site-gallery-viewer')) this.close();
  }
}
