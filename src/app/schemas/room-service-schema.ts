export class RoomServiceSchema {
  id: string
  name: string

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
  }
}

