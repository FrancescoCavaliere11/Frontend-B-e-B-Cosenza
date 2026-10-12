import {Component, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PRIVACY_PAGE, TERMS_PAGE} from '../../content/legal.content';

const PAGES = {privacy: PRIVACY_PAGE, terms: TERMS_PAGE} as const;
export type LegalPageKey = keyof typeof PAGES;
export const ROUTE_LEGAL_KEY = 'legal';

/** Testi legali (privacy, termini) scelti dal `data` della rotta. */
@Component({
  selector: 'site-legal',
  standalone: false,
  templateUrl: './legal.html',
})
export class LegalPage {
  protected readonly page = PAGES[(inject(ActivatedRoute).snapshot.data[ROUTE_LEGAL_KEY] as LegalPageKey) ?? 'privacy'];
}
