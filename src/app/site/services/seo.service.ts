import {Injectable, inject} from '@angular/core';
import {Meta} from '@angular/platform-browser';

const DEFAULT_DESCRIPTION =
  'Bed & breakfast di charme nel cuore di Cosenza: camere curate, colazione alla pasticceria di famiglia, la Calabria a pochi passi.';

/** Meta description per pagina (il titolo lo imposta il router). */
@Injectable({providedIn: 'root'})
export class SeoService {
  private readonly meta = inject(Meta);

  setDescription(description: string | undefined): void {
    this.meta.updateTag({name: 'description', content: description ?? DEFAULT_DESCRIPTION});
  }
}
