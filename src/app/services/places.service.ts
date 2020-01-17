import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, switchMap } from 'rxjs/operators';

import { Place } from '../models/place.model';
import { AuthService } from './auth.service';
import { PlaceLocation } from '../models/location.model';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private _places = new BehaviorSubject<Place[]>([]);

  // [
  //   new Place(
  //     'p1',
  //     'Manhattan Mansion',
  //     'In the heart of New York City.',
  //     'https://lonelyplanetimages.imgix.net/mastheads/GettyImages-538096543_medium.jpg?sharp=10&vib=20&w=1200',
  //     149.99,
  //     new Date('2019-11-01'),
  //     new Date('2029-12-31'),
  //     'abc'
  //   ),
  //   new Place(
  //     'p2',
  //     "L'Amour Toujours",
  //     'A romantic place in Paris!',
  //     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/1024px-Paris_Night.jpg',
  //     189.99,
  //     new Date('2019-01-13'),
  //     new Date('2023-12-31'),
  //     'abc'
  //   ),
  //   new Place(
  //     'p3',
  //     'The Foggy Palace',
  //     'Not your average city trip!',
  //     'https://upload.wikimedia.org/wikipedia/commons/0/01/San_Francisco_with_two_bridges_and_the_fog.jpg',
  //     99.99,
  //     new Date('2019-05-13'),
  //     new Date('2025-12-31'),
  //     'xyz'
  //   )
  // ]

  constructor(private authServ: AuthService, private http: HttpClient) { }

  get places() {
    return this._places.asObservable();
  }

  fetchPlaces() {
    return this.authServ.token.pipe(take(1), switchMap(token => {
      return this.http.get<{[key: string]: PlaceData}>
      (`https://infinity-stays.firebaseio.com/offered-places.json?auth=${token}`);
    }),
    map(respData => {
      const places = [];
      for(const key in respData) {
        if(respData.hasOwnProperty(key)) {
          places.push(new Place(key, respData[key].title, respData[key].description, respData[key].imageUrl, respData[key].price, new Date(respData[key].availableFrom), new Date(respData[key].availableTo), respData[key].userId, respData[key].location));

        }
      }
      return places;
    }),
    tap(places => {
      this._places.next(places);
    }));
  }

  fetchMyOffers(){
    let fetchedId: string;
    return this.authServ.userId.pipe(take(1), switchMap(userId => {
      if(!userId){
        throw new Error('User not found!');
      }
      fetchedId = userId;
      return this.authServ.token;
    }), take(1), switchMap(token => {
      return this.http.get<{[key: string]: PlaceData}>
      (`https://infinity-stays.firebaseio.com/offered-places.json?orderBy="userId"&equalTo="${fetchedId}"&auth=${token}`)
    }),
    map(respData => {
      const places = [];
      for(const key in respData) {
        if(respData.hasOwnProperty(key)) {
          places.push(new Place(key, respData[key].title, respData[key].description, respData[key].imageUrl, respData[key].price, new Date(respData[key].availableFrom), new Date(respData[key].availableTo), respData[key].userId, respData[key].location));

        }
      }
      return places;
    }),
    tap(places => {
      this._places.next(places);
    }));
  }
 
  getPlace(id: string) {
    return this.authServ.token.pipe(take(1), switchMap(token => {
      return this.http.get<PlaceData>
      (`https://infinity-stays.firebaseio.com/offered-places/${id}.json?auth=${token}`);
    }),
    map(respData => {
      return new Place(id, respData.title, respData.description, respData.imageUrl, respData.price, new Date(respData.availableFrom), new Date(respData.availableTo), respData.userId, respData.location);
    }));
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);
    return this.authServ.token.pipe(take(1), switchMap(token => {
      return this.http.post<{imageUrl: string, imagePath: string}>
      ('https://us-central1-infinity-stays.cloudfunctions.net/storeImage',
      uploadData, {headers: {authorization: 'Bearer ' + token}});
    }))
    
  }

  addPlace(title: string, description: string, price: number, dateFrom: Date,
    dateTo: Date, location: PlaceLocation, imageUrl: string) {
      let generatedId: string;
      let newPlace: Place;
      let fetchedUserId: string;
      return this.authServ.userId.pipe(take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authServ.token;
      }), take(1),
      switchMap(token => {
        if(!fetchedUserId) {
          throw new Error('User not found!');
        }
        newPlace = new Place(Math.random().toString(),title, description, imageUrl, 
        price, dateFrom, dateTo, fetchedUserId, location); 

        return this.http.post<{name: string}>
        (`https://infinity-stays.firebaseio.com/offered-places.json?auth=${token}`, 
        {...newPlace, id: null})
      }),
     switchMap(respData => {
       generatedId = respData.name;
       return this.places;
     }), take(1), tap(places => {
      newPlace.id = generatedId;
      this._places.next(places.concat(newPlace));
     })
   );
  }

  updateplace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authServ.token.pipe(take(1), switchMap(token => {
      fetchedToken = token;
      return this.places;
    }),
    take(1), switchMap(places => {
      if(!places || places.length <=0) {
        return this.fetchPlaces();
      } else {
        return of(places); //to return as observable
      }
    }), switchMap(places => {
      const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
      updatedPlaces = [...places];
      const oldPlace = updatedPlaces[updatedPlaceIndex];
      updatedPlaces[updatedPlaceIndex] = new Place(oldPlace.id,title,description,oldPlace.imageUrl,oldPlace.price,oldPlace.availableFrom,oldPlace.availableTo,oldPlace.userId,oldPlace.location);
      return this.http.put(`https://infinity-stays.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`, 
    {...updatedPlaces[updatedPlaceIndex], id: null });
    }), tap(()=> {
      this._places.next(updatedPlaces);
    }));
  }
  
}
