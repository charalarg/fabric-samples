import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LocalStorageService } from 'ngx-webstorage';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RoleService } from '../services/role.service';




@Injectable({
  providedIn: 'root'
})
export class RoleAdminGuard implements CanActivate {

  constructor(
    private router: Router,
    private storageService: LocalStorageService,
    private roleService: RoleService,
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const role = this.roleService.roleSubject.getValue();
    console.log("RoleAdminGuard");
    console.log(role);
    if (role === 'Admin' || role === 'OrgAdmin') {
      return true;
    } else {
      this.router.navigate(['main/dashboard']);
      return false;
    }


 
  }


}








