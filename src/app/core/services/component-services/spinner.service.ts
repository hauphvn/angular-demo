import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  spinner: any;

  constructor() {
    this.spinner = document.getElementsByTagName('app-spinner')[0];
  }

  show() {
    if (!this.spinner) {
      this.spinner = document.getElementsByTagName('app-spinner')[0];
    }

    if (!!this.spinner && !!this.spinner.classList) {
      this.spinner.classList.remove('undisplayed');
    }
  }

  hide() {
    if (!this.spinner) {
      this.spinner = document.getElementsByTagName('app-spinner')[0];
    }

    if (!!this.spinner && !!this.spinner.classList) {
      this.spinner.classList.add('undisplayed');
    }
  }
}
