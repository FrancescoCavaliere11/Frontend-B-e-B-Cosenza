import { Injectable } from '@angular/core';
import {Environment} from '../utils/environments';
import {ExtraServiceSchema} from '../schemas/extra-service-schema';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExtraServiceService {
  private apiUrl = Environment.getInstance().apiUrl + "/extra-service/"

  private extraServicesSubject = new BehaviorSubject<ExtraServiceSchema[]>([]);
  public extraServices$ = this.extraServicesSubject.asObservable();

  private hasLoaded = false

  constructor(private http: HttpClient) {}

  loadAllExtraServices(forceRefresh = false): Observable<ExtraServiceSchema[]>{
    if(this.hasLoaded && !forceRefresh)
      return this.extraServices$
    return this.http.get<any[]>(this.apiUrl, {withCredentials: true}).pipe(
      tap(list => {
        this.hasLoaded = true;
        const extraServices = list.map(item => new ExtraServiceSchema(item))
        this.extraServicesSubject.next(extraServices)
      })
    );
  }

  refreshCache(): Observable<ExtraServiceSchema[]>{
    return this.loadAllExtraServices(true)
  }

  createExtraService(name: string, description: string | null, imageFile: File): Observable<any> {
    const formData = new FormData();

    const serviceData = {
      name: name,
      description: description
    };

    formData.append('extra_service_form', JSON.stringify(serviceData));
    formData.append('image', imageFile);

    return this.http.post<ExtraServiceSchema>(this.apiUrl, formData,{withCredentials: true}).pipe(
      tap(newExtraService => {
        const currentExtraServices = this.extraServicesSubject.getValue()
        this.extraServicesSubject.next([newExtraService, ...currentExtraServices])
      })
    );
  }

  updateExtraService(id: string, name: string, description: string | null, imageFile: File | undefined) {
    const formData = new FormData();
    const serviceData = {
      id: id,
      name: name,
      description: description
    }

    formData.append('extra_service_form', JSON.stringify(serviceData));
    if(imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<any>(this.apiUrl, formData, {withCredentials:true}).pipe(
      tap(updatedExtraService => {
        const currentExtraServices = this.extraServicesSubject.getValue()
        const index = currentExtraServices.findIndex(
          service => service.id === updatedExtraService.id
        )
        if(index !== -1) {
          currentExtraServices[index] = updatedExtraService
          this.extraServicesSubject.next([...currentExtraServices])
        }
      })
    )
  }

  deleteExtraService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`, { withCredentials: true }).pipe(
      tap(() => {
        const currentExtraServices = this.extraServicesSubject.getValue();
        const updatedList = currentExtraServices.filter(service => service.id !== id);
        this.extraServicesSubject.next(updatedList);
      })
    );
  }
}
