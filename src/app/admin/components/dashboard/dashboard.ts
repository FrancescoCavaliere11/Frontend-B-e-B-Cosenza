import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth-service';
import {
  Appointment02Icon,
  BedDoubleIcon,
  HotelBellIcon,
  LeftToRightListBulletIcon,
  Login02Icon,
  Wifi02Icon,
} from '@hugeicons/core-free-icons';

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
  protected readonly LeftToRightListBulletIcon = LeftToRightListBulletIcon;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected isLoggingOut = false;

  /** «Esci»: sessione revocata dal backend, poi pagina di login. */
  protected logout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      complete: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login'], {replaceUrl: true});
      },
    });
  }
}
