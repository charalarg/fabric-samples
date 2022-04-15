import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserTabComponent } from './user-tab.component';

const routes: Routes = [{ path: ':id', component: UserTabComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserTabRoutingModule { }
