import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppManagementService {
  private baseUrl = environment.BasePath;

  constructor(private http: HttpClient) { }

  getAppPosters(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Get_AppPosters`);
  }

  saveAppPoster(poster: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Save_AppPoster`, poster);
  }

  deleteAppPoster(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/Delete_AppPoster`, { id });
  }
}
