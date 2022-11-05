import { DateUtil } from '@app/shared/utils/date';
import { from } from 'rxjs';
import { FileModel, AWSModel } from './../../../../shared/models/fileModel';
import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange, Inject } from '@angular/core';
import { format } from 'url';
import { DocumentModel } from '@app/shared/models/videoManagementModel';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { messageConstant, ErrorCodeConstant, ErrorAWS, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { VideoProcessingService } from '@app/core/services/component-services/video-processing.service';
import { UploadS3Service } from '@app/core/services/cloud-services/upload-s3.service';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { userPrivileges } from '@app/configs/app-constants';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { Idle } from '@ng-idle/core';
import * as AWS from 'aws-sdk';
import { CheckUserPermission } from '@app/shared/utils/common';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-popup-document',
  templateUrl: './popup-document.component.html',
  styleUrls: ['./popup-document.component.scss']
})
export class PopupDocumentComponent implements OnInit {
  projectId: number;
  listDocument: FileModel[] = [];
  currentDocument: FileModel;
  currentUser: any;
  userRole: any[];
  userPrivileges = userPrivileges;
  aws: any;
  isRoleAdmin = false;
  isRoleUserPro = false;
  isRoleUserUploader = false;
  isRoleUserStandar = false;
  constructor(
    public dialogRef: MatDialogRef<PopupDocumentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private videoManagementService: VideoManagementService,
    private spinner: SpinnerService,
    private dialogService: DialogService,
    private toastr: ToastrService,
    private videoService: VideoProcessingService,
    private managementService: VideoManagementService,
    private cloudService: UploadS3Service,
    private authenService: AuthenticationService,
    private userRoleService: UserRoleService,
    private headerService: HeaderService,
    private idle: Idle,
    private dateUtil: DateUtil, private toast: ToastrService
  ) { }

  ngOnInit() {
    this.currentUser = this.authenService.currentUserValue;
    this.userRoleService.userRole.subscribe(role => (this.userRole = role));
    this.spinner.show();
    this.projectId = this.data.projectId;
    this.videoManagementService.getListDocumentByProject(this.projectId).subscribe(
      result => {
        this.spinner.hide();
        if (result) {
          this.aws = JSON.parse(result.key);
          if (result.document_data && result.document_data.length > 0) {
            this.listDocument = result.document_data.map(
              (x: { title: string; url: string; id: number; bucket: string; additionalDate: string; }) => {
                const file = new FileModel();
                file.name = x.title;
                file.aws = new AWSModel(x.url, x.bucket);
                file.id = x.id;
                file.uploadDate = this.dateUtil.convertTimeZone(x.additionalDate, environment.timeZone);
                return file;
              }
            );
          }
        }
      },
      errorResponse => {
        this.spinner.hide();
      }
    );
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
        );
        if (!this.isRoleAdmin) {
          const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], this.projectId);
          const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(this.projectId, data.user_policies);
          const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy, (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
          this.isRoleUserPro = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, this.projectId, dataCustomUserPolicies
          );
          this.isRoleUserUploader = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_UPLOADER, data.user_role, this.projectId, dataCustomUserPolicies
          );
          this.isRoleUserStandar = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_STANDARD, data.user_role, this.projectId, dataCustomUserPolicies
          );
        }
      }
    })
  }
  closePopup() {
    this.dialogRef.close();
  }
  documentClick(document: FileModel) {
    this.currentDocument = document;
    this.listDocument = this.listDocument.map(x => {
      if (x.id === document.id) {
        x.isActive = true;
      } else {
        x.isActive = false;
      }
      return x;
    });
  }

  downloadDocument(document: FileModel) {
    this.spinner.show();
    this.managementService.downloadDocument(this.projectId, document.id).subscribe(result => {
      window.open(result.url, '_self');
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toast.error(messageConstant.DOWNLOAD.FAILED);
    });
  }

  getDocumentDataBucket(fileName: string) {
    const option = {
      project_id: this.projectId,
      title: fileName
    };
    return this.managementService.getDocumentDataBucket(option);
  }
  uploadFile(file: FileModel, option: { bucket: string; title: string }) {
    return from(
      this.cloudService
        .upload(
          file.source,
          {
            Key: option.title,
            Bucket: option.bucket
          },
          this.aws
        )
        .promise()
    );
  }
  chooseFile() {
    this.videoService.promptForFile(['*.*']).then(
      file => {
        this.spinner.show();
        this.idle.stop();
        this.getDocumentDataBucket(file.name).subscribe(result => {
          this.aws = JSON.parse(result.key);
          const { title, bucket } = result;
          const fileDocument = new FileModel();
          fileDocument.source = file;
          fileDocument.name = file.name;
          this.uploadFile(fileDocument, { bucket, title }).subscribe(aws => {
            fileDocument.aws = aws;
            this.saveDocument({
              bucket: aws.Key,
              project_id: this.projectId,
              title: file.name
            }).subscribe(data => {
              fileDocument.isUploaded = true;
              fileDocument.id = data.id;
              fileDocument.uploadDate = this.dateUtil.convertTimeZone(data.additionalDate, environment.timeZone);
              this.listDocument.unshift(fileDocument);
              this.spinner.hide();
              this.idle.watch();
            }, this.catchError.bind(this));
          }, this.catchError.bind(this));
        }, this.catchError.bind(this));
      },
      () => {
        this.spinner.hide();
      }
    );
  }
  saveDocument(option: { bucket: string; project_id: number; title: string }) {
    return this.managementService.saveDocumentData(option);
  }
  catchError(err) {
    this.spinner.hide();
    this.idle.watch();
    this.toastr.error(err.message || err);
  }
  deleteDocument(document: FileModel) {
    this.currentDocument = document;
    const param = {
      type: 'confirm',
      title: messageConstant.DOCUMENT.TITLE_DELETE,
      message: messageConstant.DOCUMENT.CONFIRM_DELETE
    };
    this.dialogService.confirm(param).subscribe(result => {
      if (result) {
        // API call
        this.spinner.show();
        this.videoManagementService.deleteDocumentByProject(this.currentDocument.id, this.projectId).subscribe(
          data => {
            this.toastr.success(messageConstant.DOCUMENT.DELETE_SUCCESS);
            this.listDocument = this.listDocument.filter(x => x !== this.currentDocument);
            this.currentDocument = null;
            this.spinner.hide();
          },
          errorResponse => {
            this.toastr.error(messageConstant.DOCUMENT.DELETE_FAILED);
            this.spinner.hide();
          }
        );
      }
    });
  }

  get isAdmin() {
    // only > None can open this popup
    return this.headerService.roleAccount.value;
  }

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
          ResponseContentDisposition: `attachment; filename="${encodeURI(file.name)}"`,
        };
        s3.getSignedUrl('getObject', newParams, (error, url) => {
          window.open(url, '_self');
          this.spinner.hide();
        });
      }
    });
  }
}
