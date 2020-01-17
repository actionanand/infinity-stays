import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { switchMap } from 'rxjs/operators';
import { base64StringToBlob } from 'blob-util';

import { PlacesService } from 'src/app/services/places.service';
import { PlaceLocation } from 'src/app/models/location.model';

// function base64toBlob(base64Data, contentType) {
//   contentType = contentType || '';
//   const sliceSize = 1024;
//   const byteCharacters = window.atob(base64Data);
//   const bytesLength = byteCharacters.length;
//   const slicesCount = Math.ceil(bytesLength / sliceSize);
//   const byteArrays = new Array(slicesCount);

//   for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
//     const begin = sliceIndex * sliceSize;
//     const end = Math.min(begin + sliceSize, bytesLength);

//     const bytes = new Array(end - begin);
//     for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
//       bytes[i] = byteCharacters[offset].charCodeAt(0);
//     }
//     byteArrays[sliceIndex] = new Uint8Array(bytes);
//   }
//   return new Blob(byteArrays, { type: contentType });
// }


// const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
//   const byteCharacters = atob(b64Data);
//   const byteArrays = [];

//   for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//     const slice = byteCharacters.slice(offset, offset + sliceSize);

//     const byteNumbers = new Array(slice.length);
//     for (let i = 0; i < slice.length; i++) {
//       byteNumbers[i] = slice.charCodeAt(i);
//     }

//     const byteArray = new Uint8Array(byteNumbers);
//     byteArrays.push(byteArray);
//   }

//   const blob = new Blob(byteArrays, {type: contentType});
//   return blob;
// }


@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit, OnDestroy {

  form: FormGroup;
  // offerSub: Subscription;

  constructor(private placeServ: PlacesService, private router: Router, 
    private loadingCtr: LoadingController, private alertCtr: AlertController) { }

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(25)]
      }),
      description: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(130)]
      }),
      price: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(1)]
      }),
      dateFrom: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      location: new FormControl(null, {
        validators: [Validators.required]
      }),
      image: new FormControl(null)
    });
  }

  onLocationPicked(locationS: PlaceLocation) {
    this.form.patchValue({location: locationS})
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if(typeof imageData === 'string') {
      try {
        const contentType = 'image/jpeg';
        imageFile = base64StringToBlob(imageData, contentType);
        // const blob = b64toBlob(imageData, contentType);
        // imageFile = URL.createObjectURL(blob);
        // imageFile = base64toBlob(imageData.replace('data:image/jpeg;base64,', ''), 'image/jpeg');
      } catch(error) {
        console.log(error);
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({image: imageFile});
  }

  onCreateOffer() {
    if(this.form.invalid || !this.form.get('image').value) {
      return;
    }
    this.loadingCtr.create({
      message: 'Creating place...'
    }).then(loadingEl => {
      loadingEl.present();
      this.placeServ.uploadImage(this.form.get('image').value).pipe(
        switchMap(uploadResp => {
        return this.placeServ.addPlace(this.form.value.title, this.form.value.description, +this.form.value.price,
          new Date(this.form.value.dateFrom), new Date(this.form.value.dateTo), this.form.value.location, uploadResp.imageUrl);
      })
      )
    .subscribe(()=> {
          loadingEl.dismiss();
          this.form.reset();
          this.router.navigate(['/places/tabs/offers']);
        }, err => {
          loadingEl.dismiss();
          console.log(err);
          const code = err.error.error;
          let message = 'Please check your internet connection!';
          if(code === 'Permission denied') {
            message = 'Please contact the app owner!'
          } else if(code === 'Unautherized!'){
            message = 'Not autherized to upload image, Please contact the app owner!';
          }
          this.showAlert(message);
        });
    });
  }

  ngOnDestroy() {
    
  }

  private showAlert(message: string) {
    this.alertCtr.create({
      header: 'An error occurred!', message: message, buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

}
