import { map, catchError } from 'rxjs/operators';
import { JwtInterceptor } from './../../../../core/interceptors/jwt.interceptor';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { Component, OnInit, } from '@angular/core';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import pusher from 'pusher-js';
import { environment } from '@environments/environment';
import { apiPathConstant, HTTP_STATUS_CODE, PUSHER_EVENT, ACTIVITY_LOGGING_RESPONSE, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { CheckUserPermission, CommonUtil } from '@app/shared/utils/common';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { HeaderService } from '@app/core/services/component-services/header.service';

@Component({
  selector: 'app-system-log',
  templateUrl: './system-log.component.html',
  styleUrls: ['./system-log.component.scss']
})
export class SystemLogComponent implements OnInit {
  fromValue: Date;
  toValue: Date;
  maxDateToValue: Date;
  maxDateFromValue: Date;
  minDateFromValue: Date;
  channelName: string;
  pusher: pusher;
  fileStorage;
  disabled = false;
  pusherKey;
  isRoleAdmin = false;

  constructor(
    private systemService: SystemManagementService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private spinner: SpinnerService,
    private authenticationService: AuthenticationService,
    private jwtInterceptor: JwtInterceptor,
    private headerService: HeaderService,
  ) { }

  ngOnInit() {
    this.spinner.show();
    const today = new Date();
    this.maxDateToValue = new Date();
    this.toValue = new Date();
    this.fromValue = new Date();
    this.minDateFromValue = new Date();
    this.maxDateFromValue = new Date();
    const date = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    this.minDateFromValue.setFullYear(year - 1);
    // this.maxDateFromValue.setDate(date);
    this.fromValue.setMonth(month - 3);

    let projectId = +localStorage.getItem('currentProjectId');
    this.headerService.projectIdActice.next(projectId);
    this.headerService.userRole.subscribe(data => {
      if (data && data.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data
        );

        if (this.isRoleAdmin) {
          this.getDataFileStogare();
        }
      }
    });
  }

  getDataFileStogare() {
    this.systemService.getLogFileStogare().subscribe(response => {
      this.fileStorage = response;
      this.spinner.hide();
    });
  }

  onBlurDate(event) {
    const today = new Date(this.toValue);
    this.minDateFromValue = new Date(this.toValue);
    this.maxDateFromValue = new Date(this.toValue);
    const date = today.getDate();
    const year = today.getFullYear();
    this.minDateFromValue.setFullYear(year - 1);
    this.maxDateFromValue.setDate(date);
    if (this.toValue.setHours(0, 0, 0, 0) < this.fromValue.setHours(0, 0, 0, 0)) {
      this.disabled = true;
    } else {
      this.disabled = false;
    }
  }

  exportDataLogging() {
    this.systemService.getLogChannelName().subscribe(({ channel_name, key }) => {
      this.channelName = channel_name;
      this.pusherKey = JSON.parse(key);
      this.createConnectionPusher(this.pusherKey.key, this.pusherKey.cluster);
      const exportData = {
        start_date: `${this.formatDate(this.fromValue)}T00:00:00.000`,
        end_date: `${this.formatDate(this.toValue)}T00:00:00.000`,
      };
      this.spinner.show();
      const channel = this.pusher.subscribe(this.channelName);
      this.pusher.bind(PUSHER_EVENT.EXPORT_ACTIVITY_LOGGING, this.handleExportFile.bind(this));
      exportData['channel_name'] = this.channelName;
      channel.bind(PUSHER_EVENT.SUBSCRIPTION_SUCCEEDED, () => {
        this.systemService.exportDataLogging(exportData).subscribe();
      });
      channel.bind(PUSHER_EVENT.SUBSCRIPTION_ERROR, (error) => {
        this.handleError401(error);
      });
    },
      error => {
        this.spinner.hide();
      }
    );
  }

  handleExportFile(response: any) {
    if (response.hasOwnProperty('status') && response.status === HTTP_STATUS_CODE.BAD_REQUEST) {
      const messageCode = response.message.substr(0, response.message.indexOf(':'));
      switch (messageCode) {
        case ACTIVITY_LOGGING_RESPONSE.CODE.ACTIVITY_LOG_01:
          this.toastr.error(ACTIVITY_LOGGING_RESPONSE.MESSAGE.ACTIVITY_LOG_01);
          break;
        case ACTIVITY_LOGGING_RESPONSE.CODE.ACTIVITY_LOG_02:
          this.toastr.error(ACTIVITY_LOGGING_RESPONSE.MESSAGE.ACTIVITY_LOG_02);
          break;
        case ACTIVITY_LOGGING_RESPONSE.CODE.ACTIVITY_LOG_10:
          this.toastr.error(ACTIVITY_LOGGING_RESPONSE.MESSAGE.ACTIVITY_LOG_10);
          break;
        case ACTIVITY_LOGGING_RESPONSE.CODE.ACTIVITY_LOG_11:
          this.toastr.error(ACTIVITY_LOGGING_RESPONSE.MESSAGE.ACTIVITY_LOG_11);
          break;
        case ACTIVITY_LOGGING_RESPONSE.CODE.ACTIVITY_LOG_12:
          this.toastr.error(ACTIVITY_LOGGING_RESPONSE.MESSAGE.ACTIVITY_LOG_12);
          break;
      }
    } else {
      CommonUtil.downloadFile(response);
    }
    this.pusher.unsubscribe(this.channelName);
    this.spinner.hide();
  }

  onDeleteLogging(data) {
    const param = {
      type: 'confirm',
      title: 'Delete log',
      message: `${data} record will be delete?`
    };
    this.dialogService.confirm(param).subscribe(res => {
      if (!res) {
        return;
      }
      this.spinner.show();
      this.systemService.removeLogging().subscribe(result => {
        this.spinner.hide();
        this.getDataFileStogare();
        this.toastr.success('Deleted successfully');
      });
    });
  }

  formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }
    return [year, month, day].join('-');
  }

  createConnectionPusher(key, cluster) {
    this.pusher = new pusher(key, {
      cluster,
      authEndpoint: `${environment.apiUrl}/${apiPathConstant.logManagementController.EXPORT_ACTIVITY_LOGGING_PUSHER_AUTH}`,
      auth: {
        params: {}
        ,
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('currentUser')).access_token}`
        }
      }
    });
  }

  handleError401(error) {
    if (error === 401) {
      this.authenticationService.refreshAccessToken().pipe(
        map((refreshData): any => {
          this.jwtInterceptor.refreshTokenSubject.next(refreshData); // Use in else case below
          const previousUser = JSON.parse(localStorage.getItem('currentUser'));
          const currentUser = Object.assign({}, previousUser, {
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            access_token_expires_in: refreshData.access_token_expires_in,
            refresh_token_expires_in: refreshData.refresh_token_expires_in,
            token_type: refreshData.token_type
          });
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          this.authenticationService.currentUserSubject.next(currentUser);
        }),
        catchError((err): any => {
          this.spinner.hide();
          this.authenticationService.logout();
        })
      ).subscribe(() => {
        this.exportDataLogging();
      });
    }
  }
}
