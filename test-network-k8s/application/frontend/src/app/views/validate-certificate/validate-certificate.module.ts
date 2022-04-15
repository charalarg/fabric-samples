import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ValidateCertificateRoutingModule } from './validate-certificate-routing.module';
import { ValidateCertificateComponent } from './validate-certificate.component';


@NgModule({
  declarations: [
    ValidateCertificateComponent
  ],
  imports: [
    CommonModule,
    ValidateCertificateRoutingModule
  ]
})
export class ValidateCertificateModule { }
