import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { PlacesService } from 'src/app/services/places.service';
import { Place } from 'src/app/models/place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { BookingService } from 'src/app/services/booking.service';
import { AuthService } from 'src/app/services/auth.service';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';

@Component({
  selector: 'app-place-details',
  templateUrl: './place-details.page.html',
  styleUrls: ['./place-details.page.scss'],
})
export class PlaceDetailsPage implements OnInit, OnDestroy {

  place: Place;
  private placeSub: Subscription;
  isBookable: boolean = false;

  constructor(private route: ActivatedRoute, private navCtr: NavController, 
     private placesServ: PlacesService, private modalCtr: ModalController,
     private actionSheetCtr: ActionSheetController, private bookingServ: BookingService,
     private loadingCtr: LoadingController, private authServ:AuthService, 
     private alertCtr: AlertController, private router: Router) { }
  

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')) {
        this.navCtr.navigateBack('/places/tabs/discover');
        return;
      }
      let fetchedUserId: string;
      this.authServ.userId.pipe(take(1), switchMap(userId => {
        if(!userId) {
          throw new Error('Found no user!');
        }
        fetchedUserId = userId;
        return this.placesServ.getPlace(paramMap.get('placeId'));
      }))
      .subscribe(place => {
        this.place = place;
        this.isBookable = this.place.userId  !== fetchedUserId;
      }, error => {
        this.alertCtr.create({
          header: 'An error occurred!',
          message: 'Place could not be fetched, please try again later!',
          buttons: [{
            text: 'Okay',
            handler: ()=> {
              this.router.navigate(['/places/tabs/discover']);
            }
          }]
        }).then(alerEl => {
          alerEl.present();
        });
      });
    });
  }

  onBookPlace() {
    // this.router.navigateByUrl('/places/tabs/discover');
    // this.navCtr.pop();
    // this.navCtr.navigateBack('/places/tabs/discover');
    this.actionSheetCtr.create({
      header: 'Choose an action',
      buttons: [
        {
          text: 'Select Date',
          handler: ()=> {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: ()=> {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    })
    .then(actionSheetEl => {
      actionSheetEl.present();
    });

  }

  onShowFullMap() {
    this.modalCtr.create({component: MapModalComponent, componentProps: {
      center: {lat: this.place.location.lat, lng: this.place.location.lng},
      selectable: false,
      closeButtonText: 'Close',
      title: this.place.location.address
    }}).then(modalEl => {
      modalEl.present();
    });
  }

  openBookingModal(mode: 'select' | 'random') {
    console.log(mode);
    this.modalCtr.create({component: CreateBookingComponent, 
      componentProps: {selectedPlace: this.place, selectedMode: mode}})
    .then(modalEl => {
      modalEl.present();
      return modalEl.onDidDismiss();
    })
    .then(resultData => {
      // console.log(resultData.role, resultData.data);
      if(resultData.role === 'confirm') {
        this.loadingCtr.create({
          message: 'Booking place...'
        }).then(loadingEl => {
          loadingEl.present();
          const data = resultData.data.bookingData;
          this.bookingServ.addBooking(this.place.id,this.place.title,this.place.imageUrl,
            data.firstName,data.lastName,data.guestNumber,data.startDate,data.endDate)
          .subscribe(()=> {
            loadingEl.dismiss();
          });
        });
      }
    });
  }

  ngOnDestroy() {
    if(this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }

}
