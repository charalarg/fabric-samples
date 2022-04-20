import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IssueCertificateRoutingModule } from './issue-certificate-routing.module';
import { IssueCertificateComponent } from './issue-certificate.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    IssueCertificateComponent
  ],
  imports: [
    CommonModule,
    IssueCertificateRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule
  ]
})
export class IssueCertificateModule { }
