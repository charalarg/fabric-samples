import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageUsersRoutingModule } from './manage-users-routing.module';
import { ManageUsersComponent } from './manage-users.component';


@NgModule({
  declarations: [
    ManageUsersComponent
  ],
  imports: [
    CommonModule,
    ManageUsersRoutingModule
  ],
  exports: [
    ManageUsersComponent,
    ManageUsersRoutingModule
  ]
})
export class ManageUsersModule { }
