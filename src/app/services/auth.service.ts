import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, from } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

import { User } from 'src/app/models/user.model';

export interface AuthRespdata {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  
  // private _userIsAuthenticated: boolean = false;
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  constructor(private http: HttpClient) { }

  get userAuthenticated() {
    return this._user.asObservable().pipe(map(user => {
      if(user) {
        return !!user.token;
      } else {
        return false;
      }
    }));
  }

  get userId() {
    return this._user.asObservable().pipe(map(user => {
      if(user) {
        return user.id;
      } else {
        return null;
      }
    }));
  }

  get token() {
    return this._user.asObservable().pipe(map(user => {
      if(user) {
        return user.token;
      } else {
        return null;
      }
    }));
  }
  
  signup(email: string, password: string) {
    return this.http.post<AuthRespdata>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseApiKey}`, 
    {email: email, password: password, returnSecureToken: true})
    .pipe(tap(this.setUserInfo.bind(this)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthRespdata>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`, 
    {email: email, password: password, returnSecureToken: true})
    .pipe(tap(this.setUserInfo.bind(this)));
  }

  logout() {
    if(this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Plugins.Storage.remove({key: 'infinityAuthData'});
  }

  private setUserInfo(userData: AuthRespdata) {
    const expirationTime = new Date( new Date().getTime() + (+userData.expiresIn * 1000));
    const userinfo = new User(userData.localId, userData.email, userData.idToken, expirationTime)
    this._user.next(userinfo);
    this.autoLogout(userinfo.tokenDuration);
    this.storeUserData(userData.localId, userData.idToken, expirationTime.toISOString(), userData.email);
  }

  storeUserData(userId: string, token: string, tokenExpiratuinDate: string, email: string) {
    const data = JSON.stringify({userId: userId, token: token, 
      tokenExpiratuinDate: tokenExpiratuinDate, email: email});
    Plugins.Storage.set({ key: 'infinityAuthData', value: data });
  }

  autoLogin() {
    return from(Plugins.Storage.get({ key: 'infinityAuthData'})).pipe(
      map(storedData => {
        if(!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as 
        {token: string, tokenExpiratuinDate: string, userId: string, email: string};
        const  expirationTime = new Date(parsedData.tokenExpiratuinDate);
        if(expirationTime <= new Date()) {
          return null;
        }
        const user = new User(parsedData.userId, parsedData.email, parsedData.token, expirationTime);
        return user;
      }), 
      tap(userdata => {
        if(userdata) {
          this._user.next(userdata);
          this.autoLogout(userdata.tokenDuration);
        }
      }),
      map(userdata => {
        return !!userdata;
      })
    );
  }

  private autoLogout(duration: number) {
    if(this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  ngOnDestroy() {
    if(this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer)
    }
  }

}
