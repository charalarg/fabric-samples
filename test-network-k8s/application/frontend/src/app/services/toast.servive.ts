
import { Injectable } from '@angular/core';
import { ToastUtility } from '@syncfusion/ej2-notifications';


@Injectable({
    providedIn: 'root'
})
export class ToastsService {

    public toastObj: any;
    constructor
        (

        ) {

    }
    public toastClose(): void {
        this.toastObj.hide();
    }
    public successToast(message: string) {
        this.toastObj = ToastUtility.show({
            title: message,
            timeOut: 5000,
            position: { X: 'Right', Y: 'Bottom' },
            showCloseButton: true,
            click: this.toastClose.bind(this),
            cssClass: 'e-toast-success',

        });

    }

    public errorToast(message: string) {
        this.toastObj = ToastUtility.show({
            title: message,
            timeOut: 5000,
            position: { X: 'Right', Y: 'Bottom' },
            showCloseButton: true,
            click: this.toastClose.bind(this),
            cssClass: 'e-toast-danger',
        });
       
    }


}
