import { Injectable } from '@angular/core';
import {Environment} from '../utils/environments';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {RoomServiceSchema} from '../schemas/room-service-schema';

@Injectable({
  providedIn: 'root',
})
export class RoomServiceService {
  private apiUrl = Environment.getInstance().apiUrl + "/room-service/"

  private roomsServicesSubject = new BehaviorSubject<RoomServiceSchema[]>([]);
  public roomsServices$ = this.roomsServicesSubject.asObservable();

  private hasLoaded = false;

  constructor(private http: HttpClient) {}

  loadAllRoomServices(forceRefresh: boolean = false): Observable<RoomServiceSchema[]> {
    if(this.hasLoaded && !forceRefresh)
      return this.roomsServices$
    return this.http.get<any[]>(this.apiUrl, {withCredentials: true}).pipe(
      tap(list => {
        this.hasLoaded = true;
        const roomServices = list.map(item => new RoomServiceSchema(item))
        this.roomsServicesSubject.next(roomServices)
      })
    );
  }

  refreshCache(): Observable<RoomServiceSchema[]>{
    return this.loadAllRoomServices(true)
  }

  createRoomService(payload: any) {
    return this.http.post<any>(this.apiUrl, payload, {withCredentials:true}).pipe(
      tap(newRoomService =>{
        const currentRoomsServices = this.roomsServicesSubject.getValue()
        this.roomsServicesSubject.next([newRoomService, ...currentRoomsServices])
      })
    )
  }

  updateRoomService(payload: any) {
    return this.http.put<any>(this.apiUrl, payload, {withCredentials:true}).pipe(
      tap(updatedRoomService => {
        const currentRoomsServices = this.roomsServicesSubject.getValue()
        const index = currentRoomsServices.findIndex(service => service.id === updatedRoomService.id)
        if(index !== -1) {
          currentRoomsServices[index] = updatedRoomService
          this.roomsServicesSubject.next([...currentRoomsServices])
        }
      })
    )
  }

  deleteRoomService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        const currentRoomsServices = this.roomsServicesSubject.getValue();
        const updatedList = currentRoomsServices.filter(service => service.id !== id);
        this.roomsServicesSubject.next(updatedList);
      })
    );
  }
}
