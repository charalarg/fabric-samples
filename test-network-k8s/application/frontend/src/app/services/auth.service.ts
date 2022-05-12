import { Injectable } from '@angular/core';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable, map, from, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // public isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  // public currentToken: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public currentAccessToken = "";
  public url = environment.API_BASE_URL;
  public logIn = environment.API_LOGIN;
  constructor(private localStorage: LocalStorageService, private httpClient: HttpClient) {
    this.loadToken();
  }


  // Load accessToken on startup
  async loadToken() {
    const token: string = await this.localStorage.retrieve(environment.ACCESS_TOKEN);
    if (token) {
      this.currentAccessToken = token;
      // this.isAuthenticated.next(true);
      // this.currentToken.next(token);
    } else {
      // this.isAuthenticated.next(false);
      // this.currentToken.next('');
    }

  }


  login(credentials: any) {
    return this.httpClient.post<any>(`${this.url}${this.logIn}`, credentials);
  }
}
