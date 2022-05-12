import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { IdfLibModule } from 'idf-lib';
import { SidebarModule } from '@syncfusion/ej2-angular-navigations';


@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    IdfLibModule,
    SidebarModule
  ]
})
export class MainModule { }
