import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivate, Router, CanLoad, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, switchMap, tap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectFromAuth implements CanActivate {
  constructor(private authServ: AuthService, private router: Router){}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.authServ.userAuthenticated.pipe(take(1), 
    switchMap(isAuth => {
      if(isAuth) {
        return of(false);
      } else {
        return of(true);
      }
    }));
  }
}

