import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { QRCodeModule } from 'angularx-qrcode';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
    NgbModalModule,
    QRCodeModule
  ],
  exports:[
    ProfileComponent
  ]
})
export class ProfileModule { }
