import {Component, OnDestroy, inject} from '@angular/core';
import {HOME_HERO, HOME_SECTIONS} from '../../content/home.content';
import {LayoutStateService} from '../../services/layout-state.service';
import {SITE} from '../../config/site.config';

/**
 * Home: logo gigante sticky sopra la foto d'apertura, poi fasce di blocchi
 * che cambiano il colore della pagina mentre attraversano il viewport.
 */
@Component({
  selector: 'site-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage implements OnDestroy {
  protected readonly layout = inject(LayoutStateService);
  protected readonly hero = HOME_HERO;
  protected readonly sections = HOME_SECTIONS;
  protected readonly site = SITE;

  ngOnDestroy(): void {
    this.layout.isWordmarkVisible.set(false);
  }

  /**
   * L'area osservata è l'ultimo 30% dello schermo: il logo resta finché il
   * fondo della sezione d'apertura è lì sotto, e sparisce prima che il
   * testo successivo gli arrivi addosso.
   */
  protected onHeroInView(visible: boolean): void {
    this.layout.isWordmarkVisible.set(visible);
  }
}
