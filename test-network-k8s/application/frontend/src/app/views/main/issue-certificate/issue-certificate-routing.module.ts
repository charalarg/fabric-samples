import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssueCertificateComponent } from './issue-certificate.component';

const routes: Routes = [{ path: '', component: IssueCertificateComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IssueCertificateRoutingModule { }
