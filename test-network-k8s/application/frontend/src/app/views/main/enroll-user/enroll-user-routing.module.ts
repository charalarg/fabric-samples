import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnrollUserComponent } from './enroll-user.component';

const routes: Routes = [{ path: '', component: EnrollUserComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnrollUserRoutingModule { }
