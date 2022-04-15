import { Component } from '@angular/core';
import { RoleService } from './services/role.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'certchain';

  constructor(private roleService: RoleService){
    this.roleService.loadRole();
  }
}
