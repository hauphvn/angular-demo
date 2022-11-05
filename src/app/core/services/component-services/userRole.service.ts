// Use to listen/emit event between video and chart

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  public userRole: BehaviorSubject<any>;
  constructor() {
    this.userRole = new BehaviorSubject<any>([]);
  }
}
