import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonItemSliding, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { BookingService } from '../services/booking.service';
import { Booking } from '../models/booking.model';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {

  loadedBookings: Booking[];
  private bookingSub: Subscription;

  constructor(private bookingServ: BookingService, private loadingCtr: LoadingController,
    private alertCtr: AlertController) { }

  ngOnInit() {
    this.bookingSub = this.bookingServ.bookings.subscribe(bookings =>{
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.loadingCtr.create({ message:'Fetching your booking...' })
    .then(loadingEl => {
      loadingEl.present();
      this.bookingServ.fetchBookings().subscribe(()=> {
        loadingEl.dismiss();
      }, err => {
        loadingEl.dismiss();
        // console.log(err);
        const code = err.error.error;
        let message = 'Please check your internet connection!';
        if(code === 'Permission denied') {
          message = 'Please re-login to verify your authentication!'
        }
        this.showAlert(message);
      });
    });
  }

  onCanncelBooking(bookingId: string, slidingBooking: IonItemSliding) {
    slidingBooking.close();
    this.alertCtr.create({
      header: 'Are you sure?',
      message: 'Really want to cancel your Booking?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: ()=> {
            this.loadingCtr.create({message: 'Cancelling your booking...'})
            .then(loadingEl => {
              loadingEl.present();
              this.bookingServ.cancelBooking(bookingId).subscribe(()=>{
                loadingEl.dismiss();
              });
            });
          }
        }
      ]
    }).then((alertEl)=>{
      alertEl.present();
    });
  }

  ngOnDestroy() {
    if(this.bookingSub) {
      this.bookingSub.unsubscribe();
    }
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'An error occurred!', message: message, buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

}
