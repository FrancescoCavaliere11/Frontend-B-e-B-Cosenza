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
import { ExtraServiceScreen } from './admin/screen/extra-service-screen/extra-service-screen';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor, withCredentialsInterceptor } from './security/interceptor';
import { RoomScreen } from './admin/screen/room-screen/room-screen';
import { BookingScreen } from './admin/screen/booking-screen/booking-screen';
import { BookingDetail } from './admin/components/booking-detail/booking-detail';
import { BookingCreateForm } from './admin/components/booking-create-form/booking-create-form';
import { StayCalendar } from './shared/components/stay-calendar/stay-calendar';
import { CalendarScreen } from './admin/screen/calendar-screen/calendar-screen';
import { PlanningGrid } from './admin/components/planning-grid/planning-grid';

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
    ExtraServiceScreen,
    RoomScreen,
    BookingScreen,
    BookingDetail,
    BookingCreateForm,
    StayCalendar,
    CalendarScreen,
    PlanningGrid,
  ],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule, HugeiconsIconComponent],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([withCredentialsInterceptor, errorInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
