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
    return this.httpClient.post<any>(`${this.url}${environment.API_GET_DOCUMENTS}`, payload);
  }
  validateCertificate(certID:string){
    let payload: any = {
      document: certID
    }
    return this.httpClient.post<any>(`${this.url}${environment.API_VALIDATE_DOCUMENT}`, payload);
  }

  enrollStudent(payload: any) {
    return this.httpClient.post<any>(`${this.url}${environment.API_REGISTER_CLIENT}`, payload);
  }
  getCertificates(){
    return this.httpClient.get<any>(`${this.url}${environment.API_GET_DOCUMENTS}`);
  }
  getUsers(){
    return this.httpClient.get<any>(`${this.url}${environment.API_GET_USERS}`);
  }
  getCertificatesByUser(userID:string){
    return this.httpClient.get<any>(`${this.url}${environment.API_GET_DOCUMENTS}/${userID}`);
  }
  revokeCert(certID:string){
    return this.httpClient.post<any>(`${this.url}${environment.API_REVOKE_CERT}`, certID);
  }
  getTransaction(transactionID:string){
    return this.httpClient.get<any>(`${this.url}${environment.API_GET_TRANSACTIONS}/${transactionID}`);
  }
  
  
}
