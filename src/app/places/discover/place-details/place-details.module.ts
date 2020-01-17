import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PlaceDetailsPageRoutingModule } from './place-details-routing.module';
import { PlaceDetailsPage } from './place-details.page';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlaceDetailsPageRoutingModule,
    SharedModule
  ],
  declarations: [PlaceDetailsPage, CreateBookingComponent],
  entryComponents: [CreateBookingComponent]
})
export class PlaceDetailsPageModule {}
