import { Component, OnInit } from '@angular/core';
import { RoleService } from 'src/app/services/role.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  role: string = '';
  constructor(private roleService: RoleService) { }

  ngOnInit(): void {
    this.roleService.roleSubject.subscribe(role=>{
      console.log(role);
      this.role = role;
    });
  }

}
