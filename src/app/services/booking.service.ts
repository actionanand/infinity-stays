import { Injectable } from '@angular/core';
import { Booking } from '../models/booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { take, tap, delay, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;   
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private _bookings = new BehaviorSubject<Booking[]>([]);

  constructor(private authServ: AuthService, private http: HttpClient) { }

  get bookings() {
    return this._bookings.asObservable();
  }

  addBooking(placeId: string, placeTitle: string, placeImage: string, firstName: string,
    lastName: string, guestNumber: number, dateFrom: Date, dateTo: Date) {
      
      let generatedId: string;
      let newBooking: Booking;
      let fetchedId: string;
      return this.authServ.userId.pipe(take(1), switchMap(userId => {
        if(!userId) {
          throw new Error('No user found!');
        }
        fetchedId = userId;
        return this.authServ.token;
      }), take(1), switchMap(token => {
        newBooking = new Booking(Math.random().toString(),placeId,fetchedId,placeTitle,placeImage,
        firstName,lastName,guestNumber,dateFrom,dateTo);

        return this.http.post<{name: string}>
        (`https://infinity-stays.firebaseio.com/bookings.json?auth=${token}`,
      {...newBooking, id: null})
      }),
       switchMap(respData => {
        generatedId = respData.name;
        return this.bookings;
      }),take(1), tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      }));
  }

  cancelBooking(bookingId: string) {
    return this.authServ.token.pipe(take(1), switchMap(token => {
      return this.http.delete
      (`https://infinity-stays.firebaseio.com/bookings/${bookingId}.json?auth=${token}`)
    }),
    switchMap(()=> {
      return this.bookings;
    }),take(1), tap(bookings => {
      this._bookings.next(bookings.filter(b => b.id !== bookingId));
    }));
  }

  fetchBookings() {
    let fetchedId: string;
    return this.authServ.userId.pipe(take(1), switchMap(userId => {
      if(!userId) {
        throw new Error('User not found!');
      }
      fetchedId = userId;
      return this.authServ.token;
    }), take(1), switchMap(token => {
      return this.http.get<{ [key: string]: BookingData }>
      (`https://infinity-stays.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedId}"&auth=${token}`);
    }),
    map(
      bookingData => {
        const bookings = [];
        for(const key in bookingData) {
          if(bookingData.hasOwnProperty(key)) {
            bookings.push(new Booking(key, bookingData[key].placeId, bookingData[key].userId, bookingData[key].placeTitle, bookingData[key].placeImage, bookingData[key].firstName, bookingData[key].lastName, bookingData[key].guestNumber, new Date(bookingData[key].bookedFrom), new Date(bookingData[key].bookedTo)));
          }
        }
        return bookings;
      }
    ), tap(bookings => {
      this._bookings.next(bookings);
      })
    );
  }

}
