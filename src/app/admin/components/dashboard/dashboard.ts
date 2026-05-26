import { Component } from '@angular/core';
import {Appointment02Icon, BedDoubleIcon, HotelBellIcon, Login02Icon, Wifi02Icon} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: [
    './dashboard.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
  ],
})
export class Dashboard {
  Appointment02Icon = Appointment02Icon;
  protected readonly BedDoubleIcon = BedDoubleIcon;
  protected readonly HotelBellIcon = HotelBellIcon;
  protected readonly Wifi02Icon = Wifi02Icon;
  protected readonly Login02Icon = Login02Icon;
}
