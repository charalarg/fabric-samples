import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { LocalStorageService } from 'ngx-webstorage';
import { environment } from 'src/environments/environment';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {



  constructor(private localStorage: LocalStorageService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token = this.localStorage.retrieve(environment.ACCESS_TOKEN);
    if (token) {
      request = request.clone({
        setHeaders: {
          'X-API-Key': `${token}`,

        }
      });

    }

    return next.handle(request);
  }
}
