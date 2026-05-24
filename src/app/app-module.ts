import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Navbar } from './customers/components/navbar/navbar';
import { CustomImage } from './customers/components/custom-image/custom-image';
import { LoginPage } from './customers/screen/login-page/login-page';
import { ReactiveFormsModule } from '@angular/forms';
import { Home } from './customers/screen/home/home';
import { AdminHome } from './admin/admin-home/admin-home';

@NgModule({
  declarations: [App, Navbar, CustomImage, LoginPage, Home, AdminHome],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
