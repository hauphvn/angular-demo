// Use to login/logout of the Angular app
// Allows access the currently logged in user

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '@environments/environment';
// import { UserModel } from '@app/builds/models/userModel';
import { Router } from '@angular/router';
import { NAVIGATE, apiPathConstant } from '@app/configs/app-constants';
import { SpinnerService } from '../services/component-services/spinner.service';
import { Idle } from '@ng-idle/core';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private spinnerService: SpinnerService,
    private idle: Idle
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // Login and receive user info and token if success
  login(email: string, password: string): any {
    this.idle.watch();
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.authController.LOGIN}`, {
      username: email,
      password
    });
  }

  logout() {
    this.spinnerService.show();
    this.idle.stop();
    if (this.currentUserValue) {
      this.http
        .post<any>(`${environment.apiUrl}/${apiPathConstant.authController.LOGOUT}`, {
          access_token: this.currentUserValue.access_token,
          refresh_token: this.currentUserValue.refresh_token,
          username: this.currentUserValue.email
        })
        .subscribe(
          () => {
            this.handleAfterLogoutResponse();
          },
          error => {
            this.handleAfterLogoutResponse();
          }
        );
    } else {
      this.handleAfterLogoutResponse();
    }
  }

  handleAfterLogoutResponse() {
    this.spinnerService.hide();
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate([`/${NAVIGATE.LOGIN}`]);
  }

  refreshAccessToken() {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.authController.REFRESH_TOKEN}`, {
      username: this.currentUserValue.email,
      refresh_token: this.currentUserValue.refresh_token
    });
  }

  forgotPassword(email) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.authController.FORGOT_PASSWORD}`, {
      username: email
    });
  }
}
