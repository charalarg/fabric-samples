import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {
  public users!: any[];
  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getStudents();
  }

  async getStudents() {
    await this.apiService.getUsers().toPromise().then(res => {
      this.users = res;
    })
  }

}
