import {RoomServiceSchema} from './room-service-schema';

export class RoomSchema{
  id: string;
  name: string;
  capacity: number;
  number: number
  price: number;
  services: RoomServiceSchema[];

  constructor(
    data: any
  ) {
    this.id = data.id;
    this.name = data.name;
    this.capacity = data.capacity;
    this.number = data.number;
    this.price = data.price;
    this.services = data.services.map((rs: any) => new RoomServiceSchema(rs));
  }
}
