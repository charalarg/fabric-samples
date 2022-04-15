import { Injectable } from '@angular/core';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable, map, from, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public currentAccessToken = "";
  public url = environment.API_BASE_URL;

  constructor(private localStorage: LocalStorageService, private httpClient: HttpClient) {

  }




  issueCertificate(payload: any) {
    return this.httpClient.post<any>(`${this.url}/api/documents'`, payload);
  }
}
