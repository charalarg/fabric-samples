import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IMenuItem } from 'idf-lib/lib/interfaces/i-menu-item';

import { ToastComponent as TsComponent } from '@syncfusion/ej2-angular-notifications';

import { SidebarComponent } from '@syncfusion/ej2-angular-navigations';
import { LocalStorageService } from 'ngx-webstorage';
import { ToastsService } from 'src/app/services/toast.servive';
import { RoleService } from 'src/app/services/role.service';

@Component({
  selector: 'ats-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  public isOpen: boolean = true;
  public width: string = '150px';
  public mediaQuery: object = window.matchMedia('(min-width: 1150px)');
  public enableDock: boolean = true;
  public dockSize: string = '85px';
  @ViewChild('sidebar')
  sidebar!: SidebarComponent;
  menuData: Array<IMenuItem> = [];

  menuItems: Array<IMenuItem> = [{
    id: "profile", label: 'My profile', url: '/main/profile'
  }]

  @ViewChild('element')
  element!: TsComponent;
  public position = { X: 'Right', Y: 'Bottom' };

  constructor(private localStorage: LocalStorageService, private router: Router, private toastService: ToastsService, private roleService: RoleService) { }

  public open(e: any) {
    console.log("Sidebar Opened");
  }
  public close(e: any) {
    console.log("Sidebar Closed");
  }
  toggleMenuClick() {
    this.sidebar.toggle();
  }
 
  closeClick() {
    this.sidebar.hide();
  }

  ngOnInit(): void {
    this.roleService.roleSubject.subscribe(role => {
      if (role === 'Admin' || role === 'OrgAdmin') {
        this.menuData.push(
          {
            id: 'home',
            label: 'My students',
            icon: 'bi bi-people',
            url: '/main/dashboard',
          },
          {
            id: 'enroll',
            label: 'Enroll student',
            icon: 'bi bi-person-plus',
            url: '/main/enroll-user',
          }
        
        )
      } else if (role === 'User') {
        this.menuData.push(
          {
            id: 'my-certificates',
            label: 'My certificates',
            icon: 'bi bi-file-earmark-medical',
            url: '/main/dashboard',
          },
         
        )
      }
    });

  }

  logout() {
    this.localStorage.clear();
    this.roleService.roleSubject.next('');
    this.toastService.successToast('You logged out!');
    this.router.navigate(['auth/login'])
  }

}
