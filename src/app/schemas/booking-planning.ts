/**
 * Tabellone del back-office — `GET /admin/bookings/planning`.
 *
 * Specchio di `PlanningSchema` del backend. Compaiono solo i soggiorni che
 * **occupano** le camere (stessa regola della disponibilità): due barre della
 * stessa camera non si sovrappongono mai.
 */
import {BookingStatus, PaymentStatus} from './booking-enums';

/** Finestra più ampia accettata dal backend (`planning_max_window_days`). */
export const PLANNING_MAX_WINDOW_DAYS = 62;

/** Riga del tabellone. */
export class PlanningRoomSchema {
  id: string;
  number: number;
  name: string;
  /** Una camera disattivata arriva solo se ha soggiorni nella finestra. */
  enabled: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.number = data.number;
    this.name = data.name;
    this.enabled = !!data.enabled;
  }
}

/** Barra del tabellone: una per camera di ogni prenotazione. */
export class PlanningStaySchema {
  booking_id: string;
  code: string;
  room_id: string;
  /** Date reali della riga camera: possono sporgere dalla finestra. */
  check_in: string;
  check_out: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  guest_name: string;
  guest_count: number;
  hold_expires_at: string | null;

  constructor(data: any) {
    this.booking_id = data.booking_id;
    this.code = data.code;
    this.room_id = data.room_id;
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.status = data.status;
    this.payment_status = data.payment_status;
    this.guest_name = data.guest_name;
    this.guest_count = data.guest_count;
    this.hold_expires_at = data.hold_expires_at ?? null;
  }
}

export class PlanningSchema {
  date_from: string;
  /** Esclusa, come la data di partenza di un soggiorno. */
  date_to: string;
  rooms: PlanningRoomSchema[];
  stays: PlanningStaySchema[];

  constructor(data: any) {
    this.date_from = data.date_from;
    this.date_to = data.date_to;
    this.rooms = (data.rooms ?? []).map((room: any) => new PlanningRoomSchema(room));
    this.stays = (data.stays ?? []).map((stay: any) => new PlanningStaySchema(stay));
  }
}
