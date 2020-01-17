import { Component, OnInit, OnDestroy } from '@angular/core';
import { SegmentChangeEventDetail } from '@ionic/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/place.model';
import { AuthService } from 'src/app/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {

  loadedPlaces: Place[];
  listedLoadedPlaces: Place[];
  relevantPlaces: Place[];
  private placesSub: Subscription;

  constructor(private placesServ: PlacesService, private authServ: AuthService, private loadingCtr: LoadingController,
    private alertCtr: AlertController) { }

  ngOnInit() {
    this.placesSub = this.placesServ.places.subscribe(places => {
      this.loadedPlaces = places;
      this.relevantPlaces = this.loadedPlaces;
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  ionViewWillEnter() {
    this.loadingCtr.create({
      message: 'Fetching places...'
    }).then(loadingEl => {
      loadingEl.present();
      this.placesServ.fetchPlaces().subscribe(()=> {
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

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.authServ.userId.pipe(take(1)).subscribe(userId => {
      if(event.detail.value === 'all') {
        this.relevantPlaces = this.loadedPlaces;
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      } else {
        this.relevantPlaces = this.loadedPlaces.filter(
          place =>  place.userId !== userId
          );
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }
    });
  }

  ngOnDestroy() {
    if(this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'An error occurred!', message: message, buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

}
