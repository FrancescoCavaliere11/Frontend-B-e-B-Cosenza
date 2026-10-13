import {RoomServiceSchema} from './room-service-schema';

/** `ROOM_DESCRIPTION_MAX_LENGTH` del backend (`room_schema.py`). */
export const ROOM_DESCRIPTION_MAX_LENGTH = 1000;

export class RoomSchema{
  id: string;
  name: string;
  capacity: number;
  number: number
  price: number;
  enabled: boolean;
  /** Testo libero mostrato sul sito; `null` se assente. */
  description: string | null;
  services: RoomServiceSchema[];

  constructor(
    data: any
  ) {
    this.id = data.id;
    this.name = data.name;
    this.capacity = data.capacity;
    this.number = data.number;
    this.price = data.price;
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.description = data.description ?? null;
    this.services = data.services.map((rs: any) => new RoomServiceSchema(rs));
  }
}
