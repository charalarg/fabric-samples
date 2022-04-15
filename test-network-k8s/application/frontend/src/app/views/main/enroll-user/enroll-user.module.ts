import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnrollUserRoutingModule } from './enroll-user-routing.module';
import { EnrollUserComponent } from './enroll-user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    EnrollUserComponent
  ],
  imports: [
    CommonModule,
    EnrollUserRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgbDatepickerModule
  ]
})
export class EnrollUserModule { }
