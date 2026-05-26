import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginPage} from './customers/screen/login-page/login-page';
import {AdminHome} from './admin/screen/admin-home/admin-home';
import {RoomServiceScreen} from './admin/screen/room-service-screen/room-service-screen';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'admin',
    component: AdminHome,
    title: 'Admin Home',
    children: [
      { path:'', redirectTo: 'bookings', pathMatch: 'full' },
      { path:'bookings', component:LoginPage, title: 'Bookings Page' }, // todo
      { path:'rooms', component:LoginPage, title: 'Rooms Page' }, // todo
      { path:'rooms-services', component:RoomServiceScreen, title: 'Rooms Services Page' },
      { path:'extra-services', component:LoginPage, title: 'Extra Services Page' }, // todo
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
