import {Component, effect, inject} from '@angular/core';
import {LayoutStateService} from '../../services/layout-state.service';
import {ScrollLockService} from '../../services/scroll-lock.service';
import {BookingPanelService} from '../../services/booking-panel.service';
import {MAIN_NAV} from '../../config/navigation.config';
import {SITE} from '../../config/site.config';
import {isNavGroup} from '../../models/site.models';
import {UI} from '../../i18n/it';

const LOCK_OWNER = 'drawer';

/** Menu mobile a tutto schermo: voci grandi, gruppi ad accordion, «Prenota» in fondo. */
@Component({
  selector: 'site-drawer',
  standalone: false,
  templateUrl: './site-drawer.html',
  styleUrl: './site-drawer.css',
  host: {
    'id': 'site-drawer',
    '[class.is-open]': 'layout.isDrawerOpen()',
    '[attr.aria-hidden]': '!layout.isDrawerOpen()',
    '[attr.inert]': 'layout.isDrawerOpen() ? null : ""',
  },
})
export class SiteDrawer {
  protected readonly layout = inject(LayoutStateService);
  protected readonly booking = inject(BookingPanelService);
  private readonly scrollLock = inject(ScrollLockService);

  protected readonly nav = MAIN_NAV;
  protected readonly site = SITE;
  protected readonly ui = UI.nav;
  protected readonly isGroup = isNavGroup;

  constructor() {
    effect(() => {
      if (this.layout.isDrawerOpen()) this.scrollLock.lock(LOCK_OWNER);
      else this.scrollLock.unlock(LOCK_OWNER);
    });
  }

  protected openBooking(): void {
    this.layout.closeMenus();
    this.booking.open();
  }
}
