import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2, OnDestroy, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(private modalCtr: ModalController, private renderer: Renderer2,
    private http: HttpClient) { }

  @ViewChild('map', {static: false}) mapElRef: ElementRef;
  @Input() center = {lat: 8.0883, lng: 77.5385};
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancel';
  @Input() title = 'Pick a Location';
  clickListener: any;
  googleMaps: any;

  ngOnInit() {}

  ngAfterViewInit() {
    this.getGoogleMaps().then( googleMap => {
      this.googleMaps = googleMap;
      const mapEl = this.mapElRef.nativeElement;
      const map = new googleMap.Map(mapEl, {
        center: this.center,
        zoom: 16
      });
      this.googleMaps.event.addListenerOnce(map, 'idle', () => {
        this.renderer.addClass(mapEl, 'visible');
      });

      if(this.selectable) {
        this.clickListener = map.addListener('click', event => {
          const selectedCords = {lat: event.latLng.lat() ,lng: event.latLng.lng()};
          this.modalCtr.dismiss(selectedCords);
        }); 
      } else {
        const marker = new googleMap.Marker({
          position: this.center,
          map: map,
          title: 'Location on map',
        });
        marker.setMap(map);
      }
      
    }).catch(err => {
      console.log(err);
    });
  }

  onCancel() {
    this.modalCtr.dismiss();
  }

  private getGoogleMaps(): Promise<any> {
    const win = window as any;
    const googleModule = win.google;
    if(googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + environment.googleMapKey;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if(loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google Map sdk not available!');
        }
      }
    });
  }

  ngOnDestroy() {
    if(this.clickListener) {
      this.googleMaps.event.removeListener(this.clickListener);
    }
  }

}
