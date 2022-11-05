import { apiPathConstant } from './../../../configs/app-constants';
import { from, of, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  constructor(private http: HttpClient) {}

  changePassword(oldPassword: string, newPassword: string, confirmNewPassword: string) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.userManagementController.USER}`, {
      oldPassword,
      newPassword,
      confirmNewPassword
    });
  }

  getUserRole() {
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.userManagementController.ROLE}`);
  }
}
