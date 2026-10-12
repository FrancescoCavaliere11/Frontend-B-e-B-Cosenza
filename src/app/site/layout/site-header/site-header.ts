import {Component, computed, inject} from '@angular/core';
import {LayoutStateService} from '../../services/layout-state.service';
import {ScrollService} from '../../services/scroll.service';
import {BookingPanelService} from '../../services/booking-panel.service';
import {MAIN_NAV, SITE_ROUTES} from '../../config/navigation.config';
import {NavGroup, isNavGroup} from '../../models/site.models';
import {UI} from '../../i18n/it';

/** Oltre questa quota, scendendo, il logo dell'header si nasconde. */
const LOGO_HIDE_AFTER = 160;

/**
 * Header sticky: navigazione a sinistra (burger su mobile), logo al
 * centro, «Prenota» a destra. Allo scroll compare un gradiente dal colore
 * del tema; scendendo il logo sfuma, risalendo ricompare.
 */
@Component({
  selector: 'site-header',
  standalone: false,
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  host: {
    'class': 'header',
    '[class.has-scrolled]': 'scroll.hasScrolled()',
    '[class.is-logo-hidden]': 'isLogoHidden()',
    '[class.is-dropdown-open]': 'layout.openDropdown() !== null',
    '[class.is-drawer-open]': 'layout.isDrawerOpen()',
    '(document:keydown.escape)': 'layout.closeMenus()',
  },
})
export class SiteHeader {
  protected readonly layout = inject(LayoutStateService);
  protected readonly scroll = inject(ScrollService);
  protected readonly booking = inject(BookingPanelService);

  protected readonly nav = MAIN_NAV;
  protected readonly routes = SITE_ROUTES;
  protected readonly ui = UI.nav;
  protected readonly isGroup = isNavGroup;

  protected readonly isLogoHidden = computed(() =>
    this.layout.isWordmarkVisible()
    || (this.scroll.direction() === 'down' && this.scroll.y() > LOGO_HIDE_AFTER && !this.layout.isDrawerOpen())
  );

  protected toggleDropdown(group: NavGroup): void {
    this.layout.openDropdown.update(open => (open === group.label ? null : group.label));
  }

  protected toggleDrawer(): void {
    this.layout.openDropdown.set(null);
    this.layout.isDrawerOpen.update(open => !open);
  }

  protected openBooking(): void {
    this.layout.closeMenus();
    this.booking.open();
  }
}
