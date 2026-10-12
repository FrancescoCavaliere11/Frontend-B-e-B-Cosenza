import {Directive, ElementRef, OnDestroy, OnInit, inject, input, output} from '@angular/core';
import {InViewService} from '../services/in-view.service';

const IN_VIEW_CLASS = 'is-in-view';

/**
 * Aggiunge `.is-in-view` quando l'elemento entra nel viewport: le
 * animazioni (`.reveal`, `.connection-line`) le fa il CSS.
 * Con `siteInViewOnce = false` la classe segue entrata e uscita.
 */
@Directive({selector: '[siteInView]', standalone: false})
export class InViewDirective implements OnInit, OnDestroy {
  readonly siteInViewOnce = input(true);
  readonly siteInViewMargin = input('0px 0px -10% 0px');
  readonly siteInViewChange = output<boolean>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly inView = inject(InViewService);
  private stop: (() => void) | null = null;

  ngOnInit(): void {
    this.stop = this.inView.observe(this.element, isIntersecting => {
      if (!isIntersecting && this.siteInViewOnce()) return;
      this.element.classList.toggle(IN_VIEW_CLASS, isIntersecting);
      this.siteInViewChange.emit(isIntersecting);
      if (isIntersecting && this.siteInViewOnce()) this.dispose();
    }, this.siteInViewMargin());
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  private dispose(): void {
    this.stop?.();
    this.stop = null;
  }
}
