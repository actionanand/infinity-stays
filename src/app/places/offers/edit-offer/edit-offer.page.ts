import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/place.model';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {

  place: Place;
  form: FormGroup;
  private offerSub: Subscription;
  private updateOfferSub: Subscription;
  placeId: string;

  constructor(private route: ActivatedRoute, private placesServ: PlacesService, 
    private navCtr: NavController, private router: Router, private loadingCtr: LoadingController,
    private alertCtr: AlertController) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')) {
        this.navCtr.navigateBack('/places/tabs/offers');
        return;
      }

      this.placeId = paramMap.get('placeId');
      this.offerSub = this.placesServ.getPlace(paramMap.get('placeId')).subscribe(place => {
      this.place = place;
      this.form = new FormGroup({
        title: new FormControl(this.place.title, {
          updateOn: 'blur',
          validators: [Validators.required, Validators.minLength(3), Validators.maxLength(25)]
          }),
        description: new FormControl(this.place.description, {
          updateOn: 'blur',
          validators: [Validators.required, Validators.minLength(5), Validators.maxLength(130)]
          })
        });
      }, error => {
        this.alertCtr.create({
          header: 'An error occurred!',
          message: 'Place could not be fetched, please try again later!',
          buttons: [{
            text: 'Okay',
            handler: ()=> {
              this.router.navigate(['/places/tabs/offers']);
            }
          }]
        }).then(alerEl => {
          alerEl.present();
        });
      });

    });
  }

  onUpdateOffer() {
    if(this.form.invalid) {
      return;
    }
    this.loadingCtr.create({
      message: 'Updating place...'
    }).then(loadingEl => {
      loadingEl.present();
      this.updateOfferSub = this.placesServ.updateplace(this.place.id, this.form.value.title, this.form.value.description)
      .subscribe(()=> {
        loadingEl.dismiss();
        this.form.reset();
        this.router.navigate(['/places/tabs/offers']);
      });
    });
  }

  ngOnDestroy() {
    if(this.offerSub) {
      this.offerSub.unsubscribe();
    }

    if(this.updateOfferSub) {
      this.updateOfferSub.unsubscribe();
    }
  }

}
