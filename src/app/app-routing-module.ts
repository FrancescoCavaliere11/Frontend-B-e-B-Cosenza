import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginPage} from './auth/login-page/login-page';
import {AdminHome} from './admin/screen/admin-home/admin-home';
import {RoomServiceScreen} from './admin/screen/room-service-screen/room-service-screen';
import {ExtraServiceScreen} from './admin/screen/extra-service-screen/extra-service-screen';
import {RoomScreen} from './admin/screen/room-screen/room-screen';
import {BookingScreen} from './admin/screen/booking-screen/booking-screen';
import {CalendarScreen} from './admin/screen/calendar-screen/calendar-screen';
import {adminGuard} from './security/admin-guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'admin',
    component: AdminHome,
    title: 'Admin Home',
    canActivate: [adminGuard],
    children: [
      // Il Calendario è la pagina iniziale dell'area admin (incremento 7, P1).
      { path:'', redirectTo: 'calendar', pathMatch: 'full' },
      { path:'calendar', component:CalendarScreen, title: 'Calendar Page' },
      { path:'bookings', component:BookingScreen, title: 'Bookings Page' },
      { path:'rooms', component:RoomScreen, title: 'Rooms Page' },
      { path:'rooms-services', component:RoomServiceScreen, title: 'Rooms Services Page' },
      { path:'extra-services', component:ExtraServiceScreen, title: 'Extra Services Page' },
      // Deve restare l'ultima: le rotte si provano nell'ordine in cui sono
      // scritte. Un indirizzo sconosciuto sotto /admin passa comunque dalla
      // guard del genitore, quindi chi non è admin finisce su /login.
      { path:'**', redirectTo: 'calendar' },
    ]
  },
  // Sito pubblico: modulo caricato a parte, così l'admin non lo scarica.
  // Deve restare l'ultima rotta: il sito gestisce da sé anche il 404.
  {
    path: '',
    loadChildren: () => import('./site/site-module').then(module => module.SiteModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Il sito usa overlay sopra le pagine indice: lo scroll lo governa
    // `SiteScrollRestoration`, non il router.
    scrollPositionRestoration: 'disabled',
    anchorScrolling: 'enabled',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
