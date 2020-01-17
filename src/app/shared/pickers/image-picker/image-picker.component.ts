import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { Plugins, Capacitor, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {

  @Output() imagePick = new EventEmitter<string | File>();
  @ViewChild('filePicker', {static: false}) filePickerRef: ElementRef<HTMLInputElement>;
  @Input() showPreview = false;
  selectedImage: string;
  usePicker: boolean = true;

  constructor(private platform: Platform) { }

  ngOnInit() {
    if((this.platform.is('mobile') && !this.platform.is('hybrid')) || this.platform.is('desktop')) {
      this.usePicker = true;
    }
  }

  onPickImage() {
    if(!Capacitor.isPluginAvailable('Camera')) {
      this.filePickerRef.nativeElement.click();
      return;
    }
    Plugins.Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,
      correctOrientation: true,
      height: 640,
      width: 640,
      resultType: CameraResultType.Base64
    }).then(image => {
      this.selectedImage = 'data:image/jpeg;base64,' + image.base64String;
      this.imagePick.emit(image.base64String);
    }).catch(err => {
      console.log(err);
      if(this.usePicker) {
        this.filePickerRef.nativeElement.click();
      }
      return false;
    });
  }

  onFileChosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if(!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload =  () => {
      const dataurl = fr.result.toString();
      this.selectedImage = dataurl;
      // console.log(pickedFile);
      this.imagePick.emit(pickedFile);
    }
    fr.readAsDataURL(pickedFile);
  }

}
