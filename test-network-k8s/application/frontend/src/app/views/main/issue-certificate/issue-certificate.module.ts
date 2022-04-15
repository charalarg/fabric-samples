import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IssueCertificateRoutingModule } from './issue-certificate-routing.module';
import { IssueCertificateComponent } from './issue-certificate.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    IssueCertificateComponent
  ],
  imports: [
    CommonModule,
    IssueCertificateRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class IssueCertificateModule { }
