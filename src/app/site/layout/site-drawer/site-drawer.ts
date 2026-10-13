import {Component, effect, inject} from '@angular/core';
import {LayoutStateService} from '../../services/layout-state.service';
import {ScrollLockService} from '../../services/scroll-lock.service';
import {BookingPanelService} from '../../services/booking-panel.service';
import {MAIN_NAV} from '../../config/navigation.config';
import {SITE} from '../../config/site.config';
import {NavItem, isNavGroup} from '../../models/site.models';

/** Riga del menu mobile: etichetta di gruppo (non cliccabile) o link. */
interface DrawerEntry {
  key: string;
  kind: 'group' | 'link';
  label: string;
  path?: string;
  /** Link che appartiene a un gruppo: più piccolo, stretto sotto l'etichetta. */
  inGroup: boolean;
  /** Ultimo link del gruppo: dopo di lui una linea separa le voci principali. */
  closesGroup: boolean;
  /** Posizione per la comparsa scaglionata. */
  index: number;
}

/** Tutte le voci in colonna: i gruppi diventano un'etichetta sopra i loro link. */
function toEntries(nav: ReadonlyArray<NavItem>): DrawerEntry[] {
  const entries: Omit<DrawerEntry, 'index'>[] = nav.flatMap(item => isNavGroup(item)
    ? [
      {key: `group-${item.label}`, kind: 'group' as const, label: item.label, inGroup: true, closesGroup: false},
      ...item.children.map((child, i) => ({
        key: child.path, kind: 'link' as const, label: child.label, path: child.path,
        inGroup: true, closesGroup: i === item.children.length - 1,
      })),
    ]
    : [{key: item.path, kind: 'link' as const, label: item.label, path: item.path, inGroup: false, closesGroup: false}]);
  return entries.map((entry, index) => ({...entry, index}));
}
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

  protected readonly entries = toEntries(MAIN_NAV);
  protected readonly site = SITE;
  protected readonly ui = UI.nav;

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
