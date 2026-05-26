import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Navbar } from './customers/components/navbar/navbar';
import { CustomImage } from './customers/components/custom-image/custom-image';
import { LoginPage } from './customers/screen/login-page/login-page';
import { ReactiveFormsModule } from '@angular/forms';
import { Home } from './customers/screen/home/home';
import { Dashboard } from './admin/components/dashboard/dashboard';
import { AdminHome } from './admin/screen/admin-home/admin-home';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { RoomServiceScreen } from './admin/screen/room-service-screen/room-service-screen';
import { ListItem } from './admin/components/list-item/list-item';

@NgModule({
  declarations: [
    App,
    Navbar,
    CustomImage,
    LoginPage,
    Home,
    AdminHome,
    Dashboard,
    RoomServiceScreen,
    ListItem,
  ],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule, HugeiconsIconComponent],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
