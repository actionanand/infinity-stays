import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Plugins, Capacitor } from '@capacitor/core';

import { environment } from 'src/environments/environment';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { PlaceLocation, Coordinates } from 'src/app/models/location.model';


@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {

  selectedLocationImage: string;
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview = false;
  
  constructor(private modalCtr: ModalController, private http: HttpClient,
    private actionSheetCtr: ActionSheetController, private alertCtr: AlertController) { }

  ngOnInit() {}

  onPickLocation() {
    this.actionSheetCtr.create({
      header: 'Please Choose',
      buttons: [
        {text: 'Auto Locate', handler: () => {
          this.locateUser();
          }
        },
        {text: 'Pick on map', handler: () => {
          this.openMap();
          }
        },
        {
          text: 'Cancel', role: 'cancel'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });
  }

  private openMap() {
    this.modalCtr.create({component: MapModalComponent}).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if(!modalData) {
          return;
        }
        const coordinates: Coordinates = {
          lat: modalData.data.lat,
          lng: modalData.data.lng
        };
        this.createLocation(coordinates.lat, coordinates.lng);
      });
      modalEl.present();
    });
  }

  private createLocation(latValue: number, lngValue: number) {
    const pickedLocation: PlaceLocation = {
      lat: latValue,
      lng: lngValue,
      address: null,
      staticMapImageUrl: null
    };
    this.getAddress(latValue, lngValue).pipe(switchMap(address => {
      pickedLocation.address = address;
      return of(this.getMap(pickedLocation.lat, pickedLocation.lng, 15));
    })).subscribe(staticMapImg => {
      pickedLocation.staticMapImageUrl = staticMapImg;
      this.selectedLocationImage = staticMapImg;
      this.locationPick.emit(pickedLocation);
    });
  }

  private locateUser() {
    if(!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    Plugins.Geolocation.getCurrentPosition().then(geoPosition => {
      const coordinates: Coordinates = {
        lat: geoPosition.coords.latitude, 
        lng: geoPosition.coords.longitude
      };
      this.createLocation(coordinates.lat, coordinates.lng);
    }).catch(err => {
      this.showErrorAlert();
    })
  }

  private showErrorAlert() {
    this.alertCtr.create({
      header: 'Could not fetch the Location', 
      message: 'Please pick the location manually again!',
    buttons: [
      {text: 'Okay', role: 'cancel'}
      ]
    }).then(alertEl => {
        alertEl.present();
      });
  }

  private getAddress(lat: number, lng: number) {
    return this.http.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${environment.googleMapKey}`).
    pipe(map(geoData => {
      if(!geoData || !geoData.results || geoData.results.length === 0) {
        return null;
      }
      return geoData.results[0].formatted_address;
    }));
  }

  private getMap(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:green%7Clabel:place%7C${lat},${lng}
    &key=${environment.googleMapKey}`;
  }

}
