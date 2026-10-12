import {Component, DOCUMENT, OnDestroy, OnInit, effect, inject} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs';
import {ThemeService} from '../../services/theme.service';
import {ScrollService} from '../../services/scroll.service';
import {LayoutStateService} from '../../services/layout-state.service';
import {BookingPanelService} from '../../services/booking-panel.service';
import {SeoService} from '../../services/seo.service';
import {DEFAULT_THEME, ROUTE_DESCRIPTION_KEY, ROUTE_OVERLAY_KEY, ROUTE_THEME_KEY} from '../../config/theme.config';
import {INTRO_SEEN_STORAGE_KEY} from '../../config/site.config';
import {SITE_ROUTES} from '../../config/navigation.config';
import {prefersReducedMotion} from '../../utils/media';
import {ThemeName} from '../../models/site.models';

/** Classe che attiva il design system del sito su `<html>`. */
const SITE_CLASS = 'site';
/** Chiave del `data` di rotta che apre subito la prenotazione (`/prenota`). */
export const ROUTE_OPEN_BOOKING_KEY = 'openBooking';

/**
 * Guscio del sito pubblico: header, contenuto, footer, copertina iniziale
 * e pannello di prenotazione. Al cambio di rotta applica tema e
 * descrizione, chiude i menu e decide se tornare in cima.
 */
@Component({
  selector: 'site-layout',
  standalone: false,
  templateUrl: './site-layout.html',
  styleUrl: './site-layout.css',
})
export class SiteLayout implements OnInit, OnDestroy {
  protected readonly layout = inject(LayoutStateService);
  protected readonly booking = inject(BookingPanelService);

  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly themes = inject(ThemeService);
  private readonly scroll = inject(ScrollService);
  private readonly seo = inject(SeoService);

  private previousUrl = '';
  private previousWasOverlay = false;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.onNavigation());

    // Ogni frame di scroll ricalcola il tema delle sezioni (Home).
    effect(() => {
      this.scroll.y();
      this.themes.syncTriggers();
    });
  }

  ngOnInit(): void {
    this.document.documentElement.classList.add(SITE_CLASS);
    this.scroll.start();
    this.layout.isIntroVisible.set(this.shouldShowIntro());
    this.onNavigation();
  }

  ngOnDestroy(): void {
    this.document.documentElement.classList.remove(SITE_CLASS);
    this.scroll.stop();
    this.themes.reset();
    this.layout.closeMenus();
  }

  protected onIntroDone(): void {
    this.layout.isIntroVisible.set(false);
    try {
      sessionStorage.setItem(INTRO_SEEN_STORAGE_KEY, '1');
    } catch {
      // Storage non disponibile (navigazione privata): la copertina tornerà, pazienza.
    }
  }

  protected onBookingClosed(): void {
    this.booking.close();
    if (this.router.url === SITE_ROUTES.book) this.router.navigateByUrl(SITE_ROUTES.home);
  }

  private onNavigation(): void {
    const leaf = this.leafOf(this.route.snapshot);
    const url = this.router.url.split(/[?#]/)[0];
    const isOverlay = this.dataOf<boolean>(leaf, ROUTE_OVERLAY_KEY) === true;

    this.layout.closeMenus();
    this.seo.setDescription(this.dataOf<string>(leaf, ROUTE_DESCRIPTION_KEY));
    // Un overlay non dichiara un tema: eredita quello della pagina sotto.
    this.themes.apply(this.dataOf<ThemeName>(leaf, ROUTE_THEME_KEY) ?? DEFAULT_THEME);

    // Aprire o chiudere un overlay non deve spostare la pagina sotto.
    const closingOverlay = this.previousWasOverlay && this.previousUrl.startsWith(`${url}/`);
    if (!isOverlay && !closingOverlay && url !== this.previousUrl) this.scroll.toTop();

    if (this.dataOf<boolean>(leaf, ROUTE_OPEN_BOOKING_KEY)) this.booking.open();

    this.previousUrl = url;
    this.previousWasOverlay = isOverlay;
  }

  private shouldShowIntro(): boolean {
    if (prefersReducedMotion() || this.router.url.split(/[?#]/)[0] !== SITE_ROUTES.home) return false;
    try {
      return sessionStorage.getItem(INTRO_SEEN_STORAGE_KEY) === null;
    } catch {
      return false;
    }
  }

  private leafOf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let leaf = snapshot;
    while (leaf.firstChild) leaf = leaf.firstChild;
    return leaf;
  }

  /** Dato di rotta cercato dalla foglia verso la radice (eredità dei figli). */
  private dataOf<T>(leaf: ActivatedRouteSnapshot, key: string): T | undefined {
    for (let node: ActivatedRouteSnapshot | null = leaf; node; node = node.parent) {
      if (key in node.data) return node.data[key] as T;
    }
    return undefined;
  }
}
