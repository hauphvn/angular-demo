import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { JwtInterceptor } from './../../../../core/interceptors/jwt.interceptor';
import { HttpErrorResponse } from '@angular/common/http';
import { EXPORT, PUSHER_EVENT, EXPORT_CSV_RESPONSE, HTTP_STATUS_CODE } from './../../../../configs/app-constants';
import { Component, OnInit, Inject, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatChipInputEvent,
  MatAutocompleteSelectedEvent,
  MatDialog,
} from '@angular/material';
import {
  EXPORT_PATTERN,
  exportPatternOptions,
  timeOptions,
  aggregationOptions,
  fileTypeOptions
} from '@app/configs/app-constants';
import { FormControl } from '@angular/forms';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { map, catchError, startWith } from 'rxjs/operators';
import { Observable, timer } from 'rxjs';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import pusher from 'pusher-js';
import { CommonUtil } from '@app/shared/utils/common';
import { environment } from '@environments/environment';
import { apiPathConstant, messageConstant, ErrorCodeConstant } from '@app/configs/app-constants';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-popup-export',
  templateUrl: './popup-export.component.html',
  styleUrls: ['./popup-export.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PopupExportComponent implements OnInit {
  header: string;
  exportPatternOptions: any = exportPatternOptions;
  timeOptions: any = timeOptions;
  aggregationOptions: any = aggregationOptions;
  fileTypeOptions: any = fileTypeOptions;
  export_pattern: number;
  aggregation_pattern: number;
  file_pattern: number;
  time_pattern: number;
  folder_ids: any;
  video_detail_ids: any;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  separatorKeysCodes = [ENTER, COMMA];
  projectCtrl = new FormControl();
  filteredFolders: Observable<any[]>;
  dropdownListFolder = [];
  folders = [];
  videoCtrl = new FormControl();
  filteredVideos: Observable<any[]>;
  dropdownListVideoSets = [];
  videos = [];
  tempVideos = [];
  projectId = 0;
  validated = false;
  pusher: pusher;
  channelName: string;
  pusherKey;
  selectedOptionPattern = 1;
  selectedTimeOption = 1;
  selectedAggregation = 1;
  selectedFileTypeOption = 1;

  @ViewChild('folderInput', { static: false }) folderInput: ElementRef;
  @ViewChild('videoInput', { static: false }) videoInput: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<PopupExportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private videoManagementService: VideoManagementService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private authenticationService: AuthenticationService,
    private jwtInterceptor: JwtInterceptor
  ) {
    this.filteredFolders = this.projectCtrl.valueChanges.pipe(
      startWith(null),
      map((folderName: string | null) => (folderName ? this.filterFolder(folderName) : this.dropdownListFolder.slice())));

    this.filteredVideos = this.videoCtrl.valueChanges.pipe(
      startWith(null),
      map((videoName: string | null) => (videoName ? this.filterVideo(videoName) : this.dropdownListVideoSets.slice())));
  }

  ngOnInit() {
    this.header = 'Export raw data';
    this.export_pattern = 1;
    this.aggregation_pattern = 1;
    this.file_pattern = 1;
    this.time_pattern = 1;
    this.folder_ids = [];
    this.video_detail_ids = [];
    const { projectId } = this.data;
    this.projectId = projectId;
    this.getListFolder();
    this.validateAll();
    this.videoManagementService.getRawDataChannelName().subscribe(({ channel_name, key }) => {
      this.channelName = channel_name;
      this.pusherKey = JSON.parse(key);
    },
      error => {
      }
    );
  }

  validateAll() {
    if (this.export_pattern === 1) {
      if (this.folder_ids.length > 0) {
        this.validated = true;
      } else {
        this.validated = false;
      }
    } else if (this.export_pattern === 2) {
      if (this.folder_ids.length > 0 &&
        this.video_detail_ids.length > 0) {
        this.validated = true;
      } else {
        this.validated = false;
      }
    }
  }

  getListFolder() {
    this.videoManagementService.getListFolderExport(this.projectId).subscribe(res => {
      this.dropdownListFolder = res;
    },
      error => {
      }
    );
  }

  closeModal() {
    this.dialogRef.close();
  }

  getDownloadPattern(data: any) {
    this.export_pattern = this.selectedOptionPattern;
    this.time_pattern = this.selectedTimeOption;
    this.aggregation_pattern = this.selectedAggregation;
    this.file_pattern = this.selectedFileTypeOption;
  }

  getTime(data: any) {
    this.time_pattern = data;
  }

  getAggregation(data: any) {
    this.aggregation_pattern = data;
  }

  getFileType(data: any) {
    this.file_pattern = data;
  }


  addFolder(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    const folder = this.dropdownListFolder.find(x => x.name.toLowerCase() === value.toLowerCase());
    if (folder) {
      this.folders.push(folder);
      this.dropdownListFolder = this.dropdownListFolder.filter(x => x.id !== folder.id);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.projectCtrl.setValue(null);
  }

  removeFolder(folder: any): void {
    const index = this.folders.indexOf(folder);
    if (index >= 0) {
      this.folders.splice(index, 1);
    }

    if (this.export_pattern === 2) {
      this.videos = this.videos.filter(({ folderId }) => folderId !== folder.id);
    }
    this.folder_ids = this.folders.map(item => item.id);
    this.dropdownListVideoSets = this.dropdownListVideoSets.filter(({ folderId }) => folderId !== folder.id);
    if (this.videoInput) {
      this.videoInput.nativeElement.value = '';
      this.videoInput.nativeElement.blur();
      this.videoCtrl.setValue(null);
    }
    this.validateAll();
  }

  filterFolder(folderName: any) {
    return this.dropdownListFolder.filter(el => el.name.toLowerCase().indexOf(folderName.toLowerCase()) === 0);
  }

  selectedFolder(event: MatAutocompleteSelectedEvent): void {
    const { id } = event.option;
    const folder = this.dropdownListFolder.find(x => x.id === +id);
    if (!this.folders.some(el => el.id === folder.id)) {
      this.folders.push(folder);
    }
    // if (this.export_pattern === 2) {
      this.videoManagementService.getListVideoSetExport(Number(id)).subscribe(res => {
        const isDuplicate = this.dropdownListVideoSets.some(({ folderId }) => folderId === id);
        if (!isDuplicate) {
          res = res.map((item) => ({ ...item, folderId: id }));
          this.dropdownListVideoSets = this.dropdownListVideoSets.concat(res);
        }
        if (this.videoInput) {
          this.videoInput.nativeElement.value = '';
          this.videoInput.nativeElement.blur();
          this.videoCtrl.setValue(null);
        }
      },
        error => {
        }
      );
    // }
    this.folder_ids = this.folders.map(item => item.id);
    this.folderInput.nativeElement.value = '';
    this.folderInput.nativeElement.blur();
    this.projectCtrl.setValue(null);
    this.validateAll();
  }

  addVideo(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    const video = this.dropdownListVideoSets.find(x => x.name.toLowerCase() === value.toLowerCase());
    if (video) {
      this.videos.push(video);
      this.dropdownListVideoSets = this.dropdownListVideoSets.filter(x => x.id !== video.id);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.videoCtrl.setValue(null);
  }

  removeVideo(video: any): void {
    const index = this.videos.indexOf(video);
    if (index >= 0) {
      this.videos.splice(index, 1);
    }
    this.video_detail_ids = this.videos.map(item => item.id);
    this.validateAll();
  }

  filterVideo(videoName: any) {
    return this.dropdownListVideoSets.filter(el => el.name.toLowerCase().indexOf(videoName.toLowerCase()) === 0);
  }

  selectedVideo(event: MatAutocompleteSelectedEvent): void {
    const { id } = event.option;
    const video = this.dropdownListVideoSets.find(x => x.id === +id);
    if (!this.videos.some(el => el.id === video.id)) {
      this.videos.push(video);
    }
    this.video_detail_ids = this.videos.map(item => item.id);
    this.videoInput.nativeElement.value = '';
    this.videoInput.nativeElement.blur();
    this.videoCtrl.setValue(null);
    this.validateAll();
  }

  resetData() {
    this.aggregation_pattern = 1;
    this.file_pattern = 1;
    this.time_pattern = 1;
    this.folder_ids = [];
    this.folders = [];
    this.video_detail_ids = [];
    this.videos = [];
    this.dropdownListVideoSets = [];
    this.validateAll();
  }

  handleExportData() {
    this.createConnectionPusher(this.pusherKey.key, this.pusherKey.cluster);
    const exportData = {
      export_pattern: this.export_pattern,
      aggregation_pattern: this.aggregation_pattern,
      file_pattern: this.file_pattern,
      time_pattern: this.time_pattern,
      folder_ids: this.folder_ids,
      video_detail_ids: this.export_pattern === 2 ? this.video_detail_ids : []
    };
    this.spinnerService.show();
    const channel = this.pusher.subscribe(this.channelName);
    exportData['channel_name'] = this.channelName;
    channel.bind(PUSHER_EVENT.EXPORT_RAW_DATA, this.handleExportFile.bind(this));
    channel.bind(PUSHER_EVENT.SUBSCRIPTION_SUCCEEDED, () => {
      this.videoManagementService.exportData(exportData).subscribe();
    });
    channel.bind(PUSHER_EVENT.SUBSCRIPTION_ERROR, (error) => {
      this.handleError401(error);
    });
  }

  handleExportFile(response: any) {
    if (response.hasOwnProperty('status') && response.status === HTTP_STATUS_CODE.BAD_REQUEST) {
      const messageCode = response.message.substr(0, response.message.indexOf(':'));
      switch (messageCode) {
        case EXPORT_CSV_RESPONSE.CODE.EXPORT_CSV_05:
          this.toastr.error(EXPORT_CSV_RESPONSE.MESSAGE.FOLDER_NO_DATA);
          break;
        case EXPORT_CSV_RESPONSE.CODE.EXPORT_CSV_06:
          this.toastr.error(EXPORT_CSV_RESPONSE.MESSAGE.VIDEO_SETS_NO_DATA);
          break;
        default:
          this.toastr.error(EXPORT_CSV_RESPONSE.MESSAGE.FAILED);
          break;
      }
    } else {
      CommonUtil.downloadFile(response);
    }
    this.pusher.unsubscribe(this.channelName);
    this.spinnerService.hide();
  }

  createConnectionPusher(key, cluster) {
    this.pusher = new pusher(key, {
      cluster,
      authEndpoint: `${environment.apiUrl}/${apiPathConstant.managementController.EXPORT_RAW_DATA_PUSHER_AUTH}`,
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
          this.spinnerService.hide();
          this.authenticationService.logout();
        })
      ).subscribe(() => {
        this.handleExportData();
      });
    }
  }
}
