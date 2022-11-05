// Use to listen/emit event between video and chart

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  public videoDetailId: Subject<any>;
  public fullName: BehaviorSubject<string>;
  public roleAccount: BehaviorSubject<boolean>;
  public invokeOpenDashboardSettingDialog = new Subject<any>();
  public userPolicies: BehaviorSubject<any>;
  public userRole: BehaviorSubject<any>;
  public userManagementRole: BehaviorSubject<any>;
  public projectIdActice: Subject<any>;

  constructor() {
    this.videoDetailId = new Subject<any>();
    this.fullName = new BehaviorSubject<string>('');
    this.roleAccount = new BehaviorSubject<boolean>(false);
    this.userPolicies = new BehaviorSubject<any>([]);
    this.userRole = new BehaviorSubject<any>([]);
    this.userManagementRole = new BehaviorSubject<any>({});
    this.projectIdActice = new Subject<any>();
  }

  onOpenDashboardSettingClick() {
    this.invokeOpenDashboardSettingDialog.next(true);
  }
}
