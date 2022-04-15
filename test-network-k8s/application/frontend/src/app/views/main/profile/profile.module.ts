import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { QRCodeModule } from 'angularx-qrcode';


@NgModule({
  declarations: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
   
    QRCodeModule
  ],
  exports:[
    ProfileComponent
  ]
})
export class ProfileModule { }
