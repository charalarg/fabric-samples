import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserTabRoutingModule } from './user-tab-routing.module';
import { UserTabComponent } from './user-tab.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { QRCodeModule } from 'angularx-qrcode';


@NgModule({
  declarations: [
    UserTabComponent
  ],
  imports: [
    CommonModule,
    UserTabRoutingModule,
    NgbModalModule,
    QRCodeModule
  ]
})
export class UserTabModule { }
