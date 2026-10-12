import {Injectable, computed, signal} from '@angular/core';

/**
 * Stato condiviso fra header, drawer e Home: chi è aperto, e se il logo
 * gigante della Home è ancora visibile (finché lo è, l'header nasconde il suo).
 */
@Injectable({providedIn: 'root'})
export class LayoutStateService {
  readonly isDrawerOpen = signal(false);
  readonly openDropdown = signal<string | null>(null);
  readonly isWordmarkVisible = signal(false);
  readonly isIntroVisible = signal(false);

  readonly isAnythingOpen = computed(() => this.isDrawerOpen() || this.openDropdown() !== null);

  closeMenus(): void {
    this.isDrawerOpen.set(false);
    this.openDropdown.set(null);
  }
}
