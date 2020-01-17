import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonItemSliding, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { Place } from 'src/app/models/place.model';
import { PlacesService } from 'src/app/services/places.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy {

  offers: Place[];
  private offerSub: Subscription;

  constructor(private placesSev: PlacesService, private router: Router, 
    private loadingCtr: LoadingController, private alertCtr: AlertController) { }

  ngOnInit() {
    this.offerSub = this.placesSev.places.subscribe(places => {
      this.offers = places;
    });
  }

  ionViewWillEnter() {
    this.loadingCtr.create({
      message: 'Fetching your offers...'
    }).then(loadingEl => {
      loadingEl.present();
      this.placesSev.fetchMyOffers().subscribe(()=> {
        loadingEl.dismiss();
      }, err => {
        loadingEl.dismiss();
        console.log(err);
        const code = err.error.error;
        let message = 'Please check your internet connection!';
        if(code === 'Permission denied') {
          message = 'Please re-login to verify your authentication!'
        }
        this.showAlert(message);
      });
    });
  }

  onEdit(offerId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/','places','tabs','offers','edit',offerId]);
    // console.log('Editing item', offerId);
  }

  ngOnDestroy() {
    if(this.offerSub) {
      this.offerSub.unsubscribe();
    }
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'An error occurred!', message: message, buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

}
