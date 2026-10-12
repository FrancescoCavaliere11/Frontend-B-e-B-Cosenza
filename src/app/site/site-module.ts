import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {SiteRoutingModule} from './site-routing-module';
import {StayCalendar} from '../shared/components/stay-calendar/stay-calendar';

import {InViewDirective} from './directives/in-view.directive';
import {ThemeTriggerDirective} from './directives/theme-trigger.directive';
import {FocusTrapDirective} from './directives/focus-trap.directive';

import {MediaImage} from './ui/media-image/media-image';
import {Carousel} from './ui/carousel/carousel';
import {Gallery} from './ui/gallery/gallery';
import {GalleryViewer} from './ui/gallery-viewer/gallery-viewer';
import {OverlayPanel} from './ui/overlay-panel/overlay-panel';
import {Accordion} from './ui/accordion/accordion';
import {BlockLinkComponent} from './ui/block-link/block-link';

import {SiteLayout} from './layout/site-layout/site-layout';
import {SiteHeader} from './layout/site-header/site-header';
import {SiteDrawer} from './layout/site-drawer/site-drawer';
import {SiteFooter} from './layout/site-footer/site-footer';
import {SiteIntro} from './layout/site-intro/site-intro';
import {SiteLogo} from './layout/site-logo/site-logo';
import {SiteBurger} from './layout/site-burger/site-burger';

import {BlockRenderer} from './blocks/block-renderer/block-renderer';
import {BlockText} from './blocks/block-text/block-text';
import {BlockMedia} from './blocks/block-media/block-media';
import {BlockCard} from './blocks/block-card/block-card';
import {BlockSplit} from './blocks/block-split/block-split';
import {BlockEditorial} from './blocks/block-editorial/block-editorial';

import {HomePage} from './pages/home/home';
import {RoomsPage} from './pages/rooms/rooms';
import {RoomDetailPage} from './pages/room-detail/room-detail';
import {ServicesPage} from './pages/services/services';
import {PastryPage} from './pages/pastry/pastry';
import {PlacesPage} from './pages/places/places';
import {PlaceDetailPage} from './pages/place-detail/place-detail';
import {ContactPage} from './pages/contact/contact';
import {LegalPage} from './pages/legal/legal';
import {NotFoundPage} from './pages/not-found/not-found';
import {BookingConfirmPage} from './pages/booking-confirm/booking-confirm';
import {BookingManagePage} from './pages/booking-manage/booking-manage';
import {BookingLookupPage} from './pages/booking-lookup/booking-lookup';

import {BookingPanel} from './booking/booking-panel/booking-panel';
import {BookingSearch} from './booking/booking-search/booking-search';
import {BookingSummary} from './booking/booking-summary/booking-summary';
import {BookingGuestForm} from './booking/booking-guest-form/booking-guest-form';
import {BookingPayment} from './booking/booking-payment/booking-payment';
import {BookingOutcome} from './booking/booking-outcome/booking-outcome';
import {BookingCard} from './booking/booking-card/booking-card';

/**
 * Sito pubblico, caricato a parte dall'area admin (`loadChildren`).
 * Componenti non standalone, come nel resto del progetto.
 */
@NgModule({
  declarations: [
    InViewDirective, ThemeTriggerDirective, FocusTrapDirective,
    MediaImage, Carousel, Gallery, GalleryViewer, OverlayPanel, Accordion, BlockLinkComponent,
    SiteLayout, SiteHeader, SiteDrawer, SiteFooter, SiteIntro, SiteLogo, SiteBurger,
    BlockRenderer, BlockText, BlockMedia, BlockCard, BlockSplit, BlockEditorial,
    HomePage, RoomsPage, RoomDetailPage, ServicesPage, PastryPage, PlacesPage, PlaceDetailPage,
    ContactPage, LegalPage, NotFoundPage, BookingConfirmPage, BookingManagePage, BookingLookupPage,
    BookingPanel, BookingSearch, BookingSummary, BookingGuestForm, BookingPayment, BookingOutcome, BookingCard,
  ],
  imports: [CommonModule, ReactiveFormsModule, SiteRoutingModule, StayCalendar],
})
export class SiteModule {}
