import {Directive, ElementRef, OnDestroy, OnInit, inject, input} from '@angular/core';
import {ThemeService} from '../services/theme.service';
import {ThemeName} from '../models/site.models';

/**
 * Dichiara il tema di una sezione: quando la sezione supera il centro del
 * viewport, la pagina sfuma nei suoi colori (il cambio di colore della Home).
 */
@Directive({selector: '[siteThemeTrigger]', standalone: false})
export class ThemeTriggerDirective implements OnInit, OnDestroy {
  readonly siteThemeTrigger = input.required<ThemeName>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly themes = inject(ThemeService);
  private unregister: (() => void) | null = null;

  ngOnInit(): void {
    this.unregister = this.themes.registerTrigger(this.element, this.siteThemeTrigger());
  }

  ngOnDestroy(): void {
    this.unregister?.();
  }
}
