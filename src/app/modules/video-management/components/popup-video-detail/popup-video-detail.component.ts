import { FormControl, FormGroup } from '@angular/forms';
import { CustomValidator } from './../../../../shared/validators/custom-validator';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
  AWSModel,
  CONFIRM_ITEM_ACTION,
  CONFIRM_ITEM_TYPE,
  FileModel,
  ObjectConfirmUpdateModel
} from '@app/shared/models/fileModel';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { VideoProcessingService } from '@app/core/services/component-services/video-processing.service';
import { ToastrService } from 'ngx-toastr';
import { UploadS3Service } from '@app/core/services/cloud-services/upload-s3.service';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { ErrorAWS, ErrorCodeConstant, messageConstant, userPrivileges, SORTING, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FileExtension } from '@app/configs/app-settings.config';
import { HeaderService } from '@app/core/services/component-services/header.service';
import * as AWS from 'aws-sdk';
import { environment } from '@environments/environment';
import { DateUtil } from '@app/shared/utils/date';
import { Idle } from '@ng-idle/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UpdateConfirmDialogComponent } from '../update-confirm-dialog/update-confirm-dialog.component';
import { CheckUserPermission } from '@app/shared/utils/common';
import { IdleTimeout } from 'aws-sdk/clients/elb';

@Component({
  selector: 'app-popup-video-detail',
  templateUrl: './popup-video-detail.component.html',
  styleUrls: ['./popup-video-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PopupVideoDetailComponent implements OnInit {
  header = '';
  projectId: number;
  listFolder: any[] = [];
  title = '';
  fileVideoExtension: string[] = FileExtension.VIDEO;
  fileXmlExtension: string[] = FileExtension.XML;
  fileTimeSeriesExtension: string[] = FileExtension.TIME_SERIES;
  fileVideos: FileModel[] = [];
  fileXmls: FileModel[] = [];
  fileTimeSeries: FileModel[] = [];
  videoDeletes: FileModel[] = [];
  xmlDeletes: FileModel[] = [];
  timeSeriesDeletes: FileModel[] = [];
  hasVideo = false;
  noData = messageConstant.UPLOAD.NODATA;
  currentUser: any;
  videoDetailId: number;
  isUploadMode: boolean;
  hasChange = false;
  folderIdSelected: number;
  titleForm: FormGroup;
  projectBucket: string;
  userPrivileges = userPrivileges;
  userRole: any[];
  listFolderFilter: any[];
  isViewer: boolean;
  isAdmin = false;
  isRoleAdmin = false;
  isRoleUserPro = false;
  isRoleUserUploader = false;
  isRoleUserStandar = false;
  isRoleUserMinimum = false;
  isRoleUserXMLEdit = false;
  aws = {
    accessKeyId: null,
    secretAccessKey: null,
    region: null,
    Bucket: null
  };
  constructor(
    public dialogRef: MatDialogRef<PopupVideoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private authenService: AuthenticationService,
    private spinner: SpinnerService,
    private videoService: VideoProcessingService,
    private toastr: ToastrService,
    private cloudService: UploadS3Service,
    private managementService: VideoManagementService,
    private dialogService: DialogService,
    private userRoleService: UserRoleService,
    private dateUtil: DateUtil,
    private headerService: HeaderService,
    private idle: Idle, private toast: ToastrService
  ) { }

  onNoClick(): void {
    this.dialogRef.close({
      thumbnail: this.getThumbnail()
    });
  }
  handleSaveClick() {
    this.dialog
      .open(UpdateConfirmDialogComponent, {
        width: '50%',
        minWidth: '760px',
        data: this.makeObjectUpdateConfirm(),
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.uploadVideoDetail();
        }
      });
  }
  initVideoDetail() {
    if (!this.videoDetailId) {
      return;
    }
    this.spinner.show();

    this.managementService.getVideoDetailById(this.videoDetailId).subscribe(
      result => {
        if (result) {
          this.aws = JSON.parse(result.key);
          this.projectBucket = result.bucket;
          // this.isViewer = this.userPrivileges[result.privileges[0]] === this.userPrivileges.VIEWER;
          // this.isViewer = this.isAdmin;
          this.fileVideos = result.videoData.map(x => {
            const video = new FileModel();
            video.uploadDate = this.dateUtil.convertTimeZone(x.additionalDate, environment.timeZone);
            video.isUploaded = true;
            video.id = x.id;
            video.owner = x.owner;
            video.name = x.title;
            video.thumbnail = x.thumbnail;
            video.aws = new AWSModel(x.url, x.bucket);
            video.isAlias = x.isAlias;
            return video;
          });
          this.fileXmls = result.xmlData.map(x => {
            const xml = new FileModel();
            xml.uploadDate = this.dateUtil.convertTimeZone(x.additionalDate, environment.timeZone);
            xml.isUploaded = true;
            xml.owner = x.owner;
            xml.name = x.title;
            xml.aws = new AWSModel(x.url, x.bucket);
            xml.id = x.id;
            xml.isAlias = x.isAlias;
            return xml;
          });
          this.fileTimeSeries = result.timeSeriesData.map(x => {
            const timeSeries = new FileModel();
            timeSeries.uploadDate = this.dateUtil.convertTimeZone(x.additionalDate, environment.timeZone);
            timeSeries.isUploaded = true;
            timeSeries.owner = x.owner;
            timeSeries.name = x.title;
            timeSeries.aws = new AWSModel(x.url, x.bucket);
            timeSeries.id = x.id;
            timeSeries.isAlias = x.isAlias;
            return timeSeries;
          });
          this.title = result.title;
          this.titleForm.get('titleName').setValue(this.title);
          this.titleForm.get('folderName').setValue(this.folderIdSelected);
          this.reloadEnableButton();
          this.spinner.hide();
        } else {
          this.spinner.hide();
          const param = {
            type: 'info',
            title: 'INFORM',
            message: 'You do not have permission'
          };
          this.dialogService.info(param).subscribe(response => {
            if (response) {
              this.closeDialogAndReload();
            }
          });
        }
      },
      err => {
        this.catchError(err);
      }
    );
  }

  initUploadVideo() {
    this.spinner.show();
    // When upload video we pass special variable - Enhance 2021/10/24
    this.managementService.getListFolderInProject(this.projectId, SORTING.GET_FOLDER_IN_VIDEO_SET).subscribe(
      list => {
        this.listFolder = list;
        if (this.listFolder && this.listFolder.length === 0) {
          this.spinner.hide();
          const param = {
            type: 'info',
            title: '',
            message: 'Folder does not exist on project'
          };
          this.dialogService.info(param).subscribe(res => {
            if (res) {
              this.closeDialogAndReload();
            }
          });
        }
        this.userRole = this.listFolder.map(folder => {
          // return { folderID: folder.id, privileges: folder.privileges.length > 0 ? folder.privileges : ['NONE'] };
          return { folderID: folder.id };
        });
        this.listFolderFilter = this.listFolder.filter(folder => {
          return (
            this.userRole.findIndex(role => role.folderID === folder.id) !== -1
          );
        });
        this.spinner.hide();
        if (this.listFolderFilter.length === 0) {
          const param = {
            type: 'info',
            title: 'INFORM',
            message: 'You do not have permission'
          };
          this.dialogService.info(param).subscribe(res => {
            if (res) {
              this.closeDialogAndReload();
            }
          });
        }
      },
      error => {
        this.spinner.hide();
      }
    );
  }

  ngOnInit() {
    this.userRoleService.userRole.subscribe(role => (this.userRole = role));
    this.initForm();
    const { projectId, listFolder, videoDetailId, folderId, isUploadMode } = this.data;
    this.listFolder = listFolder;
    this.videoDetailId = videoDetailId;
    this.folderIdSelected = folderId;
    this.projectId = projectId;
    this.isUploadMode = isUploadMode;
    this.currentUser = this.authenService.currentUserValue;
    this.headerService.roleAccount.subscribe(data => {
      this.isAdmin = data;
    })
    if (this.isUploadMode) {
      this.initUploadVideo();
      this.header = 'Upload Video';
      this.listFolderFilter = listFolder.filter(folder => {
        return (
          this.userRole.findIndex(
            role =>
              // +this.userPrivileges[role.privileges[0]] >= this.userPrivileges.EDITOR && role.folderID === folder.id
              this.isAdmin && role.folderID === folder.id
          ) !== -1
        );
      });
    } else {
      this.initVideoDetail();
      this.header = 'VIDEO DETAIL';
    }
    this.reloadEnableButton();
    this.checkPermission();
  }

  private checkPermission() {
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
        );
        if (data.user_policies && data.user_policies.length > 0) {
          const currentProjectId = JSON.parse(localStorage.getItem('currentProjectId'));
          data.user_policies.filter(item => {
            this.headerService.projectIdActice.next(currentProjectId);
            if (this.folderIdSelected) {
              const dataCustomUserPolicies = CheckUserPermission.getRoleBaseByFolderId(item.project_id, this.folderIdSelected, data.user_policies);
              if (item.folder_id === this.folderIdSelected) {
                this.getRole(data, item, dataCustomUserPolicies);
              }
            } else {
              const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], currentProjectId);
              const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(item.project_id, data.user_policies);
              const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy, (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
              this.getRole(data, item, dataCustomUserPolicies);
            }
          });
        }
      }
    });
  }

  private getRole(data, item, dataCustomUserPolicies) {
    this.isRoleUserPro = CheckUserPermission.userPermission(
      ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, item.project_id, dataCustomUserPolicies
    );
    this.isRoleUserUploader = CheckUserPermission.userPermission(
      ROLE_NEW_TYPE.ROLE_USER_UPLOADER, data.user_role, item.project_id, dataCustomUserPolicies
    );
    this.isRoleUserStandar = CheckUserPermission.userPermission(
      ROLE_NEW_TYPE.ROLE_USER_STANDARD, data.user_role, item.project_id, dataCustomUserPolicies
    );
    this.isRoleUserMinimum = CheckUserPermission.userPermission(
      ROLE_NEW_TYPE.ROLE_USER_MINIMUM, data.user_role, item.project_id, dataCustomUserPolicies
    );
    this.isRoleUserXMLEdit = CheckUserPermission.userPermission(
      ROLE_NEW_TYPE.ROLE_USER_XML_EDIT, data.user_role, item.project_id, dataCustomUserPolicies
    );
  }

  initForm() {
    this.titleForm = new FormGroup({
      titleName: new FormControl('', [
        CustomValidator.required,
        CustomValidator.checkSpecialCharacter(),
        CustomValidator.maxLength(200)
      ]),
      folderName: new FormControl('', [CustomValidator.required])
    });
  }

  chooseFileVideo() {
    if (this.fileVideos.length >= 3) {
      return;
    }
    const file = new FileModel();
    this.videoService
      .promptForFile(this.fileVideoExtension)
      .then(videoFile => {
        file.source = videoFile;
        file.name = videoFile.name;
        return this.videoService.generateThumbnail(videoFile);
      })
      .then((data: any) => {
        file.duration = data.duration;
        file.thumbnail = data.thumbnail;
        file.blobFile = this.dataURItoBlob(data.thumbnail);
        file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
        file.owner = this.headerService.fullName.value;
        file.isUploaded = false;
        this.fileVideos.unshift(file);
        this.reloadEnableButton();
      })
      .catch(this.catchError.bind(this));
  }

  reloadEnableButton() {
    // return true is ok
    if (this.isUploadMode) {
      this.hasChange =
        this.titleForm.valid && !this.titleForm.controls.folderName.errors && (this.fileVideos.filter(x => !x.id).length > 0 || this.videoDeletes.length > 0);
    } else {
      this.hasChange =
        (this.titleForm.valid &&
          (this.fileVideos.filter(x => !x.id).length > 0 ||
            this.videoDeletes.length > 0 ||
            this.fileXmls.filter(x => !x.id).length > 0 ||
            this.xmlDeletes.length > 0 ||
            this.fileTimeSeries.filter(x => !x.id).length > 0 ||
            this.timeSeriesDeletes.length > 0)) ||
        (this.titleForm.valid && this.titleForm.dirty);
    }
  }
  closeModal() {
    this.dialogRef.close();
  }
  chooseFileXml() {
    const file = new FileModel();
    this.videoService
      .promptForFile(this.fileXmlExtension)
      .then(xmlFile => {
        file.source = xmlFile;
        file.name = xmlFile.name;
        file.owner = this.headerService.fullName.value;
        file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
        file.isUploaded = false;
        this.fileXmls.unshift(file);
        this.reloadEnableButton();
      })
      .catch(this.catchError.bind(this));
  }
  dataURItoBlob(dataURI: string) {
    const binary = atob(dataURI.split(',')[1]);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: 'image/png' });
  }
  onChangeFolder(e) {
    this.folderIdSelected = e.value;
    this.reloadEnableButton();
  }
  removeVideo(file: FileModel) {
    this.fileVideos = this.fileVideos.filter(x => x !== file);
    if (!this.isUploadMode && file.id) {
      this.videoDeletes.push(file);
    }
    this.reloadEnableButton();
  }
  removeXml(file: FileModel) {
    this.fileXmls = this.fileXmls.filter(x => x !== file);
    if (!this.isUploadMode && file.id) {
      this.xmlDeletes.push(file);
    }
    this.reloadEnableButton();
  }

  getVideoDetailBucket() {
    const options = {
      folder_id: Number(this.folderIdSelected),
      title: this.titleForm.get('titleName').value
    };
    return this.managementService.getVideoDetailBucket(options);
  }

  getVideoDataBucket(videoDetailBucket: any, video: File) {
    const options = {
      title: video.name,
      video_detail_bucket: videoDetailBucket,
      folder_id: Number(this.folderIdSelected)
    };
    return this.managementService.getVideoDataBucket(options);
  }

  getXmlDataBucket(videoDetailBucket: any, xml: File) {
    const options = {
      title: xml.name,
      video_detail_bucket: videoDetailBucket,
      folder_id: Number(this.folderIdSelected)
    };
    return this.managementService.getXmlDataBucket(options);
  }

  getTimeSeriesDataBucket(videoDetailBucket: any, timeSeries: File) {
    const options = {
      title: timeSeries.name,
      video_detail_bucket: videoDetailBucket,
      folder_id: Number(this.folderIdSelected)
    };
    return this.managementService.getTimeSeriesDataBucket(options);
  }

  uploadFile(file: File, data: any) {
    const options = {
      Key: data.title,
      Bucket: data.bucket
    };
    return this.cloudService.upload(file, options, this.aws).promise();
  }
  blobToFile(theBlob: Blob, fileName: string): File {
    const b: any = theBlob;
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return theBlob as File;
  }
  async beforeUploadVideoData(videoDetailBucket, videoFile: FileModel) {
    try {
      const data = await this.getVideoDataBucket(videoDetailBucket, videoFile.source).toPromise();
      this.aws = JSON.parse(data.key);
      videoFile.aws = await this.uploadFile(videoFile.source, data);
      data.title = `${data.title}.png`;
      videoFile.thumbnailAws = await this.uploadFile(this.blobToFile(videoFile.blobFile, data.title), data);
      videoFile.isUploaded = true;
      return new Promise<FileModel>((res, rej) => res(videoFile));
    } catch (err) {
      videoFile.isUploaded = false;
      return new Promise<FileModel>((res, rej) => res(videoFile));
    }
  }
  async beforeUploadXmlData(videoDetailBucket, xmlFile: FileModel) {
    try {
      const data = await this.getXmlDataBucket(videoDetailBucket, xmlFile.source).toPromise();
      this.aws = JSON.parse(data.key);
      xmlFile.aws = await this.uploadFile(xmlFile.source, data);
      xmlFile.isUploaded = true;
      return new Promise<FileModel>((res, rej) => res(xmlFile));
    } catch (err) {
      xmlFile.isUploaded = true;
      return new Promise<FileModel>((res, rej) => res(xmlFile));
    }
  }
  async beforeTimeSeriesData(videoDetailBucket, timeSeriesFile: FileModel) {
    try {
      const data = await this.getTimeSeriesDataBucket(videoDetailBucket, timeSeriesFile.source).toPromise();
      this.aws = JSON.parse(data.key);
      timeSeriesFile.aws = await this.uploadFile(timeSeriesFile.source, data);
      timeSeriesFile.isUploaded = true;
      return new Promise<FileModel>((res, rej) => res(timeSeriesFile));
    } catch (err) {
      timeSeriesFile.isUploaded = true;
      return new Promise<FileModel>((res, rej) => res(timeSeriesFile));
    }
  }
  replaceAt(str) {
    const bucket = str.split('/');
    bucket.shift();
    return bucket.join('/');
  }
  saveInfoFile() {
    return this.managementService.saveVideoDetail({
      bucket: this.replaceAt(this.projectBucket),
      folder_id: Number(this.folderIdSelected),
      thumbnail: this.fileVideos.length > 0 && this.fileVideos[0].thumbnailAws.Location,
      title: this.titleForm.get('titleName').value,
      videoData: this.fileVideos
        .filter(x => x.isUploaded)
        .map(x => {
          return {
            title: (x.source && x.source.name) || x.name,
            url: x.aws.Location,
            bucket: x.aws.Key,
            thumbnail: x.thumbnailAws.Location,
            duration: x.duration
          };
        }),
      xmlData: this.fileXmls
        .filter(x => x.isUploaded)
        .map(x => {
          return {
            bucket: x.aws.Key,
            title: (x.source && x.source.name) || x.name,
            url: x.aws.Location
          };
        }),
      timeSeriesData: this.fileTimeSeries
        .filter(x => x.isUploaded)
        .map(x => {
          return {
            bucket: x.aws.Key,
            title: (x.source && x.source.name) || x.name,
            url: x.aws.Location
          };
        })
    });
  }
  catchError(err) {
    this.spinner.hide();
    this.idle.watch();
    if (err instanceof HttpErrorResponse) {
      if (err.error && err.error.message === ErrorCodeConstant.NAME_ALREADY) {
        this.toastr.error(messageConstant.UPLOAD.NAME_ALREADY);
      } else if (err.status === 400) {
        const param = {
          type: 'info',
          title: '',
          message: 'Video data title does not exist on system'
        };
        this.dialogService.info(param).subscribe(res => {
          if (res) {
            this.dialogRef.close({
              thumbnail: this.getThumbnail()
            });
          }
        });
      }
    } else {
      this.toastr.error(err.message || err);
    }
  }
  deleteVideoData(video: FileModel) {
    return this.managementService.deleteVideoDataById(video.id, this.videoDetailId).toPromise();
  }
  deleteXmlData(xml: FileModel) {
    return this.managementService.deleteXmlDataById(xml.id, this.videoDetailId).toPromise();
  }
  getThumbnail() {
    if (this.fileVideos.length > 0) {
      return (
        (this.fileVideos[0].thumbnailAws && this.fileVideos[0].thumbnailAws.Location) || this.fileVideos[0].thumbnail
      );
    }
    return null;
  }
  getVideoChange() {
    return this.fileVideos;
  }
  getXmlChange() {
    return this.fileXmls;
  }
  getTimeSeriesChange() {
    return this.fileTimeSeries;
  }
  updateVideoDetail() {
    return this.managementService.updateVideoDetail({
      folder_id: this.folderIdSelected,
      thumbnail: this.getThumbnail(),
      title: this.titleForm.get('titleName').value,
      video_detail_id: this.videoDetailId,
      videoData: this.getVideoChange().map(video => {
        return {
          bucket: video.aws.Key,
          id: video.id || 0,
          thumbnail: (video.thumbnailAws && video.thumbnailAws.Location) || video.thumbnail,
          title: (video.source && video.source.name) || video.name,
          url: video.aws.Location,
          duration: video.duration
        };
      }),
      xmlData: this.getXmlChange().map(xml => {
        return {
          bucket: xml.aws.Key,
          id: xml.id || 0,
          title: (xml.source && xml.source.name) || xml.name,
          url: xml.aws.Location
        };
      }),
      timeSeriesData: this.getTimeSeriesChange().map(timeSeries => {
        return {
          bucket: timeSeries.aws.Key,
          id: timeSeries.id || 0,
          title: (timeSeries.source && timeSeries.source.name) || timeSeries.name,
          url: timeSeries.aws.Location
        };
      }),
      deleted_videoData_ids: this.videoDeletes.map(video => {
        return video.id;
      }),
      deleted_xmlData_ids: this.xmlDeletes.map(xml => {
        return xml.id;
      }),
      deleted_timeSeriesData_ids: this.timeSeriesDeletes.map(timeSeries => {
        return timeSeries.id;
      })
    });
  }
  closePopup(data) {
    this.videoDeletes = [];
    this.xmlDeletes = [];
    this.spinner.hide();
    this.dialogRef.close({ ...data, thumbnail: data.thumbnail });
  }
  uploadVideoDetail() {
    this.spinner.show();
    const taskSave: Promise<FileModel>[] = [];
    if (this.isUploadMode) {
      this.getVideoDetailBucket().subscribe(bucketServer => {
        const configAWS = JSON.parse(bucketServer.key);
        this.aws = configAWS;
        this.idle.stop();
        this.projectBucket = bucketServer.bucket;
        this.handleUploadProcessInAllMode(bucketServer.bucket);
      }, this.catchError.bind(this));
    } else {
      this.handleUploadProcessInAllMode(this.projectBucket);
    }
  }

  // Split from function uploadVideoDetail
  // Call after get bucket video detail in upload mode
  // Call immediately in update mode
  handleUploadProcessInAllMode(videoDetailBucket) {
    const taskSave: Promise<FileModel>[] = [];
    this.fileVideos
      .filter(x => !x.isUploaded)
      .forEach(video => {
        taskSave.push(this.beforeUploadVideoData(videoDetailBucket, video));
      });
    this.fileXmls
      .filter(x => !x.isUploaded)
      .forEach(xml => {
        taskSave.push(this.beforeUploadXmlData(videoDetailBucket, xml));
      });
    this.fileTimeSeries
      .filter(x => !x.isUploaded)
      .forEach(timeSeries => {
        taskSave.push(this.beforeTimeSeriesData(videoDetailBucket, timeSeries));
      });
    Promise.all(taskSave)
      .then(data => {
        this.idle.watch();
        let isSuccess = true;
        data.forEach(item => {
          if (!item.isUploaded && item.source) {
            this.toastr.error(`${item.source.name} ${messageConstant.UPLOAD.FAILED}`, 'ERROR');
            this.fileVideos = this.fileVideos.filter(video => video !== item);
            this.fileXmls = this.fileXmls.filter(xml => xml !== item);
            this.fileTimeSeries = this.fileTimeSeries.filter(timeSeries => timeSeries !== item);
            isSuccess = false;
          }
        });
        if (isSuccess) {
          if (this.isUploadMode) {
            this.saveInfoFile().subscribe(result => {
              this.closePopup({
                folderId: this.folderIdSelected,
                video: result
              });
              this.idle.watch();
              this.toastr.success(messageConstant.UPLOAD.SUCCESS, '', { disableTimeOut: false });
            }, this.catchError.bind(this));
          } else {
            this.updateVideoDetail().subscribe((res) => {
              if (this.fileVideos.length === 0 && this.fileXmls.length === 0 && this.fileTimeSeries.length === 0) {
                this.spinner.show();
                this.managementService.deleteVideoDetailById(this.videoDetailId).subscribe(() => {
                  this.closePopup({
                    videoDetailId: this.videoDetailId,
                    folderId: this.folderIdSelected,
                    thumbnail: res.thumbnail,
                    isDelete: true
                  });
                  this.toastr.success(messageConstant.UPLOAD.MODIFY_SUCCESS, '', { disableTimeOut: false });
                  this.idle.watch();
                  this.spinner.hide();
                }, this.catchError.bind(this));
              } else {
                this.spinner.hide();
                this.closePopup({
                  folderId: this.folderIdSelected,
                  videoTitle: this.titleForm.get('titleName').value,
                  thumbnail: res.thumbnail
                });
                this.idle.watch();
                this.toastr.success(messageConstant.UPLOAD.MODIFY_SUCCESS, '', { disableTimeOut: true });
              }
            }, this.catchError.bind(this));
          }
        }
      })
      .catch(this.catchError.bind(this));
  }

  downloadFileVideo(file: FileModel) {
    this.spinner.show();
    this.managementService.downloadVideo(this.videoDetailId, file.id).subscribe(result => {
      window.open(result.url, '_self');
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toast.error(messageConstant.DOWNLOAD.FAILED);
    });
  }

  downloadFileXml(file: FileModel) {
    this.spinner.show();
    this.managementService.downloadXML(this.videoDetailId, file.id).subscribe(result => {
      window.open(result.url, '_self');
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toast.error(messageConstant.DOWNLOAD.FAILED);
    });
  }


  deleteVideoDetail() {
    this.dialog
      .open(UpdateConfirmDialogComponent, {
        width: '50%',
        minWidth: '760px',
        data: this.makeObjectDeleteConfirm(),
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.spinner.show();
          this.managementService.deleteVideoDetailById(this.videoDetailId).subscribe(() => {
            this.closePopup({ videoDetailId: this.videoDetailId, folderId: this.folderIdSelected, isDelete: true });
            this.toastr.success(messageConstant.UPLOAD.DELETE_SUCCESS);
            this.spinner.hide();
          }, this.catchError.bind(this));
        }
      });
  }

  get isViewerUser() {
    // only > Viewer can open this popup
    this.isViewer =
      this.userRole.findIndex(
        role =>
          // role.folderID === this.data.folderId &&
          // +this.userPrivileges[role.privileges[0]] === this.userPrivileges.VIEWER
          this.isAdmin && role.folderID === this.data.folderId
      ) !== -1;
    return this.isViewer;
  }
  set isViewerUser(value) {
    this.isViewer = value;
  }

  // Check file before download in AWS
  checkFileBeforeDownload(file: FileModel) {
    this.spinner.show();
    AWS.config.update({
      accessKeyId: this.aws.accessKeyId,
      secretAccessKey: this.aws.secretAccessKey,
      region: this.aws.region
    });
    const s3 = new AWS.S3();
    const params = {
      Bucket: this.aws.Bucket,
      Key: file.aws.Key // File path
    };

    s3.headObject(params, (err, metadata) => {
      if (err && err.code === ErrorAWS.NOT_FOUND) {
        this.spinner.hide();
        this.toastr.error(messageConstant.AWS.FILE_DOES_NOT_EXIST);
      } else {
        const newParams = {
          Bucket: params.Bucket,
          Key: params.Key,
          ResponseContentDisposition: `attachment; filename="${encodeURI(file.name)}"`
        };
        s3.getSignedUrl('getObject', newParams, (error, url) => {
          window.open(url, '_self');
          this.spinner.hide();
        });
      }
    });
  }

  closeDialogAndReload() {
    this.dialogRef.close();
    location.reload();
  }

  /**
   * Time Series Data
   */
  chooseFileTimeSeries() {
    const file = new FileModel();
    this.videoService
      .promptForFile(this.fileTimeSeriesExtension)
      .then(timeSeriesFile => {
        file.source = timeSeriesFile;
        file.name = timeSeriesFile.name;
        file.owner = this.headerService.fullName.value;
        file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
        file.isUploaded = false;
        this.fileTimeSeries.unshift(file);
        this.reloadEnableButton();
      })
      .catch(this.catchError.bind(this));
  }

  removeTimeSeries(file: FileModel) {
    this.fileTimeSeries = this.fileTimeSeries.filter(x => x !== file);
    if (!this.isUploadMode && file.id) {
      this.timeSeriesDeletes.push(file);
    }
    this.reloadEnableButton();
  }

  downloadTimeSeries(file: FileModel) {
    this.spinner.show();
    this.managementService.downloadTimesSeries(this.videoDetailId, file.id).subscribe(result => {
      window.open(result.url, '_self');
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toast.error(messageConstant.DOWNLOAD.FAILED);
    });
  }

  onFileVideo($event) {
    if (this.isRoleAdmin
      || this.isRoleUserUploader
      || this.isRoleUserPro) {
      const totalSize = $event.length + this.fileVideos.length;
      if (totalSize > 3) {
        return;
      }
      const videos: any = Object.values($event);
      const checkExtension = videos.every(video => video.type === 'video/mp4' || video.type === 'video/quicktime');
      if (!checkExtension) {
        return;
      }

      videos.forEach(video => {
        this.videoService.generateThumbnail(video).then((data: any) => {
          const file = new FileModel();
          file.name = video.name;
          file.duration = data.duration;
          file.source = video;
          file.thumbnail = data.thumbnail;
          file.blobFile = this.dataURItoBlob(data.thumbnail);
          file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
          file.owner = this.headerService.fullName.value;
          file.isUploaded = false;
          this.fileVideos.unshift(file);
          this.reloadEnableButton();
        });
      });
    }
  }

  onFileXML($event) {
    if (this.isRoleAdmin
      || this.isRoleUserUploader
      || this.isRoleUserPro) {
      const xmls: any = Object.values($event);
      const checkExtension = xmls.every(video => video.type === 'text/xml');
      if (!checkExtension) {
        return;
      }
      xmls.forEach(xml => {
        const file = new FileModel();
        file.source = xml;
        file.name = xml.name;
        file.owner = this.headerService.fullName.value;
        file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
        file.isUploaded = false;
        this.fileXmls.unshift(file);
        this.reloadEnableButton();
      });
    }
  }

  onFileCSV($event) {
    if (this.isRoleAdmin
      || this.isRoleUserUploader
      || this.isRoleUserPro) {
      const timeSeries: any = Object.values($event);
      const checkExtension = timeSeries.every(csv => csv.type === 'application/vnd.ms-excel');
      if (!checkExtension) {
        return;
      }
      timeSeries.forEach(csv => {
        const file = new FileModel();
        file.source = csv;
        file.name = csv.name;
        file.owner = this.headerService.fullName.value;
        file.uploadDate = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
        file.isUploaded = false;
        this.fileTimeSeries.unshift(file);
        this.reloadEnableButton();
      });
    }
  }

  dropVideos(event: CdkDragDrop<string[]>) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    if (event.previousIndex !== event.currentIndex) {
      this.hasChange = true;
    }
  }

  dropXMLs(event: CdkDragDrop<string[]>) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    if (event.previousIndex !== event.currentIndex) {
      this.hasChange = true;
    }
  }

  dropTimeSeries(event: CdkDragDrop<string[]>) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    if (event.previousIndex !== event.currentIndex) {
      this.hasChange = true;
    }
  }

  makeObjectUpdateConfirm(): ObjectConfirmUpdateModel[] {
    const objectUpdateConfirm: ObjectConfirmUpdateModel[] = [];

    for (const videoDeleted of this.videoDeletes) {
      objectUpdateConfirm.push({
        id: videoDeleted.id,
        type: CONFIRM_ITEM_TYPE.VIDEO,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: videoDeleted.name,
        aliasBeDeleted: []
      });
    }

    for (const xmlDelete of this.xmlDeletes) {
      objectUpdateConfirm.push({
        id: xmlDelete.id,
        type: CONFIRM_ITEM_TYPE.XML,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: xmlDelete.name,
        aliasBeDeleted: []
      });
    }

    for (const CSVDelete of this.timeSeriesDeletes) {
      objectUpdateConfirm.push({
        id: CSVDelete.id,
        type: CONFIRM_ITEM_TYPE.CSV,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: CSVDelete.name,
        aliasBeDeleted: []
      });
    }

    const videoAddedList = this.fileVideos.filter(video => !video.isUploaded);
    for (const videoAdded of videoAddedList) {
      objectUpdateConfirm.push({
        id: videoAdded.id,
        type: CONFIRM_ITEM_TYPE.VIDEO,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: videoAdded.name,
        aliasBeDeleted: []
      });
    }
    const XMLAddedList = this.fileXmls.filter(xml => !xml.isUploaded);
    for (const XMLAdded of XMLAddedList) {
      objectUpdateConfirm.push({
        id: XMLAdded.id,
        type: CONFIRM_ITEM_TYPE.XML,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: XMLAdded.name,
        aliasBeDeleted: []
      });
    }
    const CSVAddedList = this.fileTimeSeries.filter(csv => !csv.isUploaded);
    for (const CSVDeleted of CSVAddedList) {
      objectUpdateConfirm.push({
        id: CSVDeleted.id,
        type: CONFIRM_ITEM_TYPE.CSV,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: CSVDeleted.name,
        aliasBeDeleted: []
      });
    }

    return objectUpdateConfirm;
  }

  makeObjectDeleteConfirm(): ObjectConfirmUpdateModel[] {
    const objectUpdateConfirm: ObjectConfirmUpdateModel[] = [];

    for (const videoDeleted of this.fileVideos) {
      objectUpdateConfirm.push({
        id: videoDeleted.id,
        type: CONFIRM_ITEM_TYPE.VIDEO,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: videoDeleted.name,
        aliasBeDeleted: []
      });
    }

    for (const xmlDelete of this.fileXmls) {
      objectUpdateConfirm.push({
        id: xmlDelete.id,
        type: CONFIRM_ITEM_TYPE.XML,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: xmlDelete.name,
        aliasBeDeleted: []
      });
    }

    for (const CSVDelete of this.fileTimeSeries) {
      objectUpdateConfirm.push({
        id: CSVDelete.id,
        type: CONFIRM_ITEM_TYPE.CSV,
        action: CONFIRM_ITEM_ACTION.DELETE,
        dataName: CSVDelete.name,
        aliasBeDeleted: []
      });
    }

    const videoAddedList = this.fileVideos.filter(video => !video.isUploaded);
    for (const videoAdded of videoAddedList) {
      objectUpdateConfirm.push({
        id: videoAdded.id,
        type: CONFIRM_ITEM_TYPE.VIDEO,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: videoAdded.name,
        aliasBeDeleted: []
      });
    }
    const XMLAddedList = this.fileXmls.filter(xml => !xml.isUploaded);
    for (const XMLAdded of XMLAddedList) {
      objectUpdateConfirm.push({
        id: XMLAdded.id,
        type: CONFIRM_ITEM_TYPE.XML,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: XMLAdded.name,
        aliasBeDeleted: []
      });
    }
    const CSVAddedList = this.fileTimeSeries.filter(csv => !csv.isUploaded);
    for (const CSVDeleted of CSVAddedList) {
      objectUpdateConfirm.push({
        id: CSVDeleted.id,
        type: CONFIRM_ITEM_TYPE.CSV,
        action: CONFIRM_ITEM_ACTION.ADD_NEW,
        dataName: CSVDeleted.name,
        aliasBeDeleted: []
      });
    }

    return objectUpdateConfirm;
  }
}
