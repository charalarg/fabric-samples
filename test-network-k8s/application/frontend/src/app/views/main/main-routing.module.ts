import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { RoleAdminGuard } from 'src/app/guards/role-admin.guard';
import { MainComponent } from './main.component';

const routes: Routes = [
  {
    path: '', component: MainComponent, children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', canActivate: [AuthGuard], loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'issue-certificate', canActivate: [RoleAdminGuard], loadChildren: () => import('./issue-certificate/issue-certificate.module').then(m => m.IssueCertificateModule) },
      { path: 'manage-users', canActivate: [RoleAdminGuard], loadChildren: () => import('./manage-users/manage-users.module').then(m => m.ManageUsersModule) },
      { path: 'user-tab', canActivate: [RoleAdminGuard], loadChildren: () => import('./user-tab/user-tab.module').then(m => m.UserTabModule) },
      { path: 'enroll-user', canActivate: [RoleAdminGuard], loadChildren: () => import('./enroll-user/enroll-user.module').then(m => m.EnrollUserModule) },
    ]
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
