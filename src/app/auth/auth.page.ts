import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { AuthService, AuthRespdata } from '../services/auth.service';


@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  showPass:boolean = false;
  isLogin: boolean =true;

  constructor(private authServ: AuthService, private router: Router,
    private loadingCtr: LoadingController, private alertCtr: AlertController) { }

  ngOnInit() {
  }

 
  onSubmit(form: NgForm) {
    if(!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    let authObs: Observable<AuthRespdata>;

    this.loadingCtr.create({ keyboardClose:true, message: 'Please wait...' })
    .then(loadingEl => {
      loadingEl.present();

      if (this.isLogin) {
        authObs = this.authServ.login(email, password);
      } else {
        authObs = this.authServ.signup(email, password);
      }

      authObs.subscribe(respData => {
          loadingEl.dismiss();
          // console.log(respData);
          form.reset();
          this.router.navigateByUrl('/places/tabs/discover');
        }, errResp => {
          loadingEl.dismiss();
          const code = errResp.error.error.message;
          let message = 'could not authenticate now!, Please try after sometime';
          if(code === 'EMAIL_EXISTS') {
            message = 'This E-mail ID already exists, Please login';
          } else if(code === 'EMAIL_NOT_FOUND') {
            message = 'This E-mail address is not found, try sign up';
          } else if(code === 'INVALID_PASSWORD') {
            message = 'Please check your password! Try again';
          }
          this.showAlert(message);
          form.reset();
        });

    });

  }

  onSwitchAuthMode() {
    this.isLogin = ! this.isLogin;
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'Authentication Failed!', message: message, buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

}
