import { Injectable } from '@angular/core';
import { CanLoad, Route, UrlSegment, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, tap, switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {

  constructor(private authServ: AuthService, private router: Router) { }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.authServ.userAuthenticated.pipe(take(1), 
    switchMap(isAuth => {
      if(!isAuth) {
        return this.authServ.autoLogin();
      } else {
        return of(isAuth);
      }
    }), 
    tap(isAuth => {
      if(!isAuth) {
        this.router.navigateByUrl('/auth');
      }
    }));
  }

}