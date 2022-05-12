import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  {
    path: '', children: [
      { path: '', pathMatch: 'full', redirectTo: 'main' },
      { path: 'auth', loadChildren: () => import('./views/auth/auth.module').then(m => m.AuthModule) },
      { path: 'main',  canActivate: [AuthGuard], loadChildren: () => import('./views/main/main.module').then(m => m.MainModule) },
      { path: 'validate-certificate', loadChildren: () => import('./views/validate-certificate/validate-certificate.module').then(m => m.ValidateCertificateModule) }
    ]
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
