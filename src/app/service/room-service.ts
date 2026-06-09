import { Injectable } from '@angular/core';
import {Environment} from '../utils/environments';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {RoomSchema} from '../schemas/room-schema';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private apiUrl = Environment.getInstance().apiUrl + "/room/"

  private roomsSubject = new BehaviorSubject<RoomSchema[]>([]);
  public rooms$ = this.roomsSubject.asObservable();
  private hasLoaded = false

  constructor(private http: HttpClient) {}

  loadAllRooms(forceRefresh = false): Observable<RoomSchema[]>{
    if(this.hasLoaded && !forceRefresh)
      return this.rooms$
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(list => {
        this.hasLoaded = true;
        const rooms = list.map(item => new RoomSchema(item))
        console.log(rooms)
        this.roomsSubject.next(rooms)
      })
    );
  }

  refreshCache(): Observable<RoomSchema[]>{
    return this.loadAllRooms(true)
  }

  createRoom(
    payload: any,
    imageFile: File
  ): Observable<any> {
    const formData = new FormData();

    const roomData = {
      name: payload.name,
      capacity: payload.capacity,
      number: payload.number,
      price: payload.price,
      room_services_ids: payload.room_services_ids
    };

    formData.append('room_form', JSON.stringify(roomData));
    formData.append('image', imageFile);

    return this.http.post<RoomSchema>(this.apiUrl, formData).pipe(
      tap(newRoom => {
        const currentRooms = this.roomsSubject.getValue()
        this.roomsSubject.next([newRoom, ...currentRooms])
      })
    );

  }

  updateRoom(
    payload: any,
    imageFile?: File
  ): Observable<any> {
    const formData = new FormData();

    const roomData = {
      id: payload.id,
      name: payload.name,
      capacity: payload.capacity,
      number: payload.number,
      price: payload.price,
      room_services_ids: payload.room_services_ids
    };

    formData.append('room_form', JSON.stringify(roomData));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<any>(this.apiUrl, formData).pipe(
      tap(updatedRoom => {
        const currentRooms = this.roomsSubject.getValue();
        const index = currentRooms.findIndex(room => room.id === updatedRoom.id);
        if (index !== -1) {
          currentRooms[index] = new RoomSchema(updatedRoom);
          this.roomsSubject.next([...currentRooms]);
        }
      })
    );
  }
}
