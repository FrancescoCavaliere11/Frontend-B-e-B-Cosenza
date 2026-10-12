import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SiteLayout, ROUTE_OPEN_BOOKING_KEY} from './layout/site-layout/site-layout';
import {HomePage} from './pages/home/home';
import {RoomsPage} from './pages/rooms/rooms';
import {RoomDetailPage} from './pages/room-detail/room-detail';
import {ServicesPage} from './pages/services/services';
import {PastryPage} from './pages/pastry/pastry';
import {PlacesPage} from './pages/places/places';
import {PlaceDetailPage} from './pages/place-detail/place-detail';
import {ContactPage} from './pages/contact/contact';
import {LegalPage, ROUTE_LEGAL_KEY} from './pages/legal/legal';
import {NotFoundPage} from './pages/not-found/not-found';
import {BookingConfirmPage} from './pages/booking-confirm/booking-confirm';
import {BookingManagePage} from './pages/booking-manage/booking-manage';
import {BookingLookupPage} from './pages/booking-lookup/booking-lookup';
import {ROUTE_DESCRIPTION_KEY, ROUTE_OVERLAY_KEY, ROUTE_THEME_KEY} from './config/theme.config';
import {SITE} from './config/site.config';

/** Titolo del documento: «Pagina — Nome». */
const title = (page: string): string => `${page} — ${SITE.name}`;

/**
 * Percorsi in italiano. Quelli di `/prenotazione/*` sono fissati dal
 * backend (`email_service.py`: CONFIRM_PATH, MANAGE_PATH, BOOKING_PATH).
 */
const routes: Routes = [
  {
    path: '',
    component: SiteLayout,
    children: [
      {
        path: '',
        component: HomePage,
        title: `${SITE.name} — ${SITE.kind} a ${SITE.city}`,
        data: {[ROUTE_THEME_KEY]: 'forest'},
      },
      {
        path: 'prenota',
        component: HomePage,
        title: title('Prenota'),
        data: {[ROUTE_THEME_KEY]: 'forest', [ROUTE_OPEN_BOOKING_KEY]: true},
      },
      {
        path: 'camere',
        component: RoomsPage,
        title: title('Le camere'),
        data: {[ROUTE_THEME_KEY]: 'sage', [ROUTE_DESCRIPTION_KEY]: 'Quattro camere di charme nel centro storico di Cosenza.'},
        children: [{path: ':slug', component: RoomDetailPage, data: {[ROUTE_OVERLAY_KEY]: true}}],
      },
      {
        path: 'servizi',
        component: ServicesPage,
        title: title('Servizi'),
        data: {[ROUTE_THEME_KEY]: 'sand', [ROUTE_DESCRIPTION_KEY]: 'Colazione alla Pasticceria Elimè, transfer, esperienze sul territorio.'},
      },
      {
        path: 'pasticceria',
        component: PastryPage,
        title: title('Pasticceria e colazione'),
        data: {[ROUTE_THEME_KEY]: 'blush', [ROUTE_DESCRIPTION_KEY]: 'Pasticceria Elimè: la pasticceria di famiglia, dove fare colazione durante il soggiorno.'},
      },
      {
        path: 'territorio',
        component: PlacesPage,
        title: title('Dintorni'),
        data: {[ROUTE_THEME_KEY]: 'forest', [ROUTE_DESCRIPTION_KEY]: 'Cosenza, la Sila, il Tirreno: i luoghi da scoprire.'},
        children: [{path: ':slug', component: PlaceDetailPage, data: {[ROUTE_OVERLAY_KEY]: true}}],
      },
      {path: 'contatti', component: ContactPage, title: title('Contatti'), data: {[ROUTE_THEME_KEY]: 'linen'}},
      {path: 'prenotazione', component: BookingLookupPage, title: title('La tua prenotazione'), data: {[ROUTE_THEME_KEY]: 'linen'}},
      {path: 'prenotazione/conferma', component: BookingConfirmPage, title: title('Conferma'), data: {[ROUTE_THEME_KEY]: 'linen'}},
      {path: 'prenotazione/gestisci', component: BookingManagePage, title: title('Gestisci la prenotazione'), data: {[ROUTE_THEME_KEY]: 'linen'}},
      {path: 'privacy', component: LegalPage, title: title('Privacy'), data: {[ROUTE_THEME_KEY]: 'linen', [ROUTE_LEGAL_KEY]: 'privacy'}},
      {path: 'termini', component: LegalPage, title: title('Termini di prenotazione'), data: {[ROUTE_THEME_KEY]: 'linen', [ROUTE_LEGAL_KEY]: 'terms'}},
      {path: '**', component: NotFoundPage, title: title('Pagina non trovata'), data: {[ROUTE_THEME_KEY]: 'linen'}},
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SiteRoutingModule {}
