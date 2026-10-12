import {Component, ElementRef, computed, input, signal, viewChild, AfterViewInit} from '@angular/core';
import {MediaAsset} from '../../models/site.models';

/**
 * Immagine con effetto blur-up: si vede subito un segnaposto minuscolo
 * sfocato, poi l'originale sfuma sopra in `--dur-image`.
 * Il rapporto d'aspetto è riservato prima del caricamento (CLS ≈ 0).
 */
@Component({
  selector: 'site-media-image',
  standalone: false,
  templateUrl: './media-image.html',
  styleUrl: './media-image.css',
  host: {
    'class': 'media-image',
    '[class.is-loaded]': 'loaded()',
    '[class.is-failed]': 'failed()',
    '[class.is-contain]': 'fit() === "contain"',
    '[style.aspect-ratio]': 'fit() === "cover" ? media().ratio : null',
  },
})
export class MediaImage implements AfterViewInit {
  readonly media = input.required<MediaAsset>();
  readonly sizes = input('(max-width: 767px) 100vw, 50vw');
  readonly eager = input(false);
  readonly fit = input<'cover' | 'contain'>('cover');
  /** Alt vuoto per le immagini decorative (es. dentro un link già descritto). */
  readonly decorative = input(false);

  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);
  protected readonly alt = computed(() => (this.decorative() ? '' : this.media().alt));

  private readonly image = viewChild.required<ElementRef<HTMLImageElement>>('asset');

  ngAfterViewInit(): void {
    // Immagine già in cache: l'evento load potrebbe essere già passato.
    const element = this.image().nativeElement;
    if (element.complete && element.naturalWidth > 0) this.loaded.set(true);
  }

  protected onLoad(): void {
    this.loaded.set(true);
  }

  protected onError(): void {
    this.failed.set(true);
  }
}
