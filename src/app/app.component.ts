import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Platform, AlertController, IonRouterOutlet } from '@ionic/angular';
import { Plugins, Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';

import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

// import { StatusBar } from '@ionic-native/status-bar/ngx';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;
  private authSub: Subscription;
  private backBtnSub: Subscription;
  private previousState: boolean = false;

  constructor(private platform: Platform, private authServ: AuthService,
    private router: Router, private alertCtr: AlertController) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if(Capacitor.isPluginAvailable('SplashScreen')) {
        Plugins.SplashScreen.hide();
      }
      this.backButtonEvent();
    });
  }

  ngOnInit() {
    this.authSub = this.authServ.userAuthenticated.subscribe(isAuth => {
      if(!isAuth && this.previousState !== isAuth) {
        this.router.navigateByUrl('/auth');
      }
      this.previousState = isAuth;
    });
  }

  onLogout() {
    this.authServ.logout();
  }

  backButtonEvent() {
    this.backBtnSub = this.platform.backButton.subscribe(async () => {
      this.routerOutlets.forEach((outlet: IonRouterOutlet) => {
        if (
          this.router.url === "/places/tabs/discover"
        ) {
          this.presentAlertConfirm();
        } else if (
          this.router.url === "/places/tabs/offers"
        ) {
          this.presentAlertConfirm()
        } else if (outlet && outlet.canGoBack()) {
          outlet.pop();
        }
      });
    });
  }

  onClickexit() {
    navigator["app"].exitApp();
  }

  async presentAlertConfirm() {
    const alert = await this.alertCtr.create({
      header: 'Confirm!',
      message: 'Really want to EXIT Infinity Stays?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        }, {
          text: 'Exit',
          handler: () => {
            // console.log('Confirm Okay');
            navigator["app"].exitApp();
          }
        }
      ]
    });
    await alert.present();
  }

  ngOnDestroy() {
    if(this.authSub) {
      this.authSub.unsubscribe();
    }

    if(this.backBtnSub){
      this.backBtnSub.unsubscribe();
    }
  }

}
