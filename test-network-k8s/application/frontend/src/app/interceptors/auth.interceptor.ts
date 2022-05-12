import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

import { LocalStorageService } from 'ngx-webstorage';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {



  constructor(private localStorage: LocalStorageService, private router: Router) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token = this.localStorage.retrieve(environment.ACCESS_TOKEN);
    if (token) {
      request = request.clone({
        setHeaders: {
          'X-API-Key': `${token}`,

        }
      });

    } else {

    }

    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMsg = '';
          if (error.error instanceof ErrorEvent) {
            console.log('This is client side error');
            errorMsg = `Error: ${error.error.message}`;
          } else {
            console.log('This is server side error');
            errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
            if(error.status === 401){
              this.localStorage.clear();
              this.router.navigate(['/auth/login']);
            }
            
          }
          console.log(errorMsg);
          return throwError(() => new Error(errorMsg));
        })
      )
  }
}

