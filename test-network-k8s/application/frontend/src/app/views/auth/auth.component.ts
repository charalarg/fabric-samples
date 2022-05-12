import { Component, OnInit } from '@angular/core';
import { IMenuItem } from 'idf-lib/lib/interfaces/i-menu-item';

@Component({
  selector: 'ats-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  menuItems: Array<IMenuItem> = [
    {
    id: "login", label: 'Login', url: './login'
  },
  
  ]
  constructor() { }

  ngOnInit(): void {
  }

}
