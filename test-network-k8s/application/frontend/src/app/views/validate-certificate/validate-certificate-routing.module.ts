import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ValidateCertificateComponent } from './validate-certificate.component';

const routes: Routes = [{ path: ':id', component: ValidateCertificateComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ValidateCertificateRoutingModule { }
