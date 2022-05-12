import { Injectable } from '@angular/core';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable, map, from, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  public roleSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');


  constructor(private localStorage: LocalStorageService, private httpClient: HttpClient) {
    
  }


  // Load accessToken on startup
  async loadRole() {
    console.log('Load role');
    const role: string = await this.localStorage.retrieve(environment.ROLE);
    if (role) {
      this.roleSubject.next(role);
    } else {
      this.roleSubject.next('');
    }

  }



}
