import { VideoModel } from './../../../../shared/models/videoManagementModel';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';

import { FolderModel } from '@app/shared/models/videoManagementModel';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { MatDialog } from '@angular/material';
import { PopupVideoDetailComponent } from '../popup-video-detail/popup-video-detail.component';
import { PopupDocumentComponent } from '../popup-document/popup-document.component';
import { userPrivileges, ROLE_NEW_TYPE, sortingOptions } from '@app/configs/app-constants';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { ROWS_PER_PAGE_FOLDER } from '@app/configs/app-settings.config';
import { DateUtil } from '@app/shared/utils/date';
import { ToastrService } from 'ngx-toastr';
import { PopupCopyVideoComponent } from '@app/modules/video-management/components/popup-copy-video/popup-copy-video.component';
import { PopupExportComponent } from '../popup-export/popup-export.component';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';

@Component({
  selector: 'app-folder-table',
  templateUrl: './folder-table.component.html',
  styleUrls: ['./folder-table.component.scss']
})
export class FolderTableComponent implements OnInit, OnChanges {
  @Input() listFolder: FolderModel[] = [];
  @Input() projectName: string;
  @Input() projectId: number;
  @Output() currentSortType: EventEmitter<number> = new EventEmitter<number>();
  @Input() reGetFolderListOfProject: (projectId: number, projectName: string, sortType: number) => void;
  @Output() copyDone: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() afterVideoDelete: EventEmitter<any> = new EventEmitter<boolean>();
  listDocument: any[] = [];
  userPrivileges = userPrivileges;
  userRole: any[];
  sortingOptions = sortingOptions;
  sortingConditionFolder;
  currentSortTypeVideo = 0;
  numCurPage: number;
  isDarkTheme = false;
  isAdmin = false;
  isRoleAdmin = false;
  isRoleUserPro = false;
  isRoleUserUploader = false;
  isRoleUserStandar = false;
  isRoleUserMinimum = false;
  isRoleUserDataDl= false;

  constructor(
    private videoManagementService: VideoManagementService,
    private spinner: SpinnerService,
    public dialog: MatDialog,
    private userRoleService: UserRoleService,
    private dateUtil: DateUtil,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.userRoleService.userRole.subscribe(role => (this.userRole = role));
    this.spinner.show();
    this.numCurPage = 1;
    this.headerService.roleAccount.subscribe(data => {
      this.isAdmin = data;
    });
    this.checkBaseRole(this.projectId);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes.projectId && changes.projectId.currentValue !== changes.projectId.previousValue) {
      this.checkBaseRole(changes.projectId.currentValue);
    }
  }

  checkBaseRole(id) {
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0 && id) {
        const dataCustomUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(id, data.user_policies);
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
        );
        if (!this.isRoleAdmin) {
          this.isRoleUserPro = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, id, dataCustomUserPolicies
          );
          this.isRoleUserUploader = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_UPLOADER, data.user_role, id, dataCustomUserPolicies
          );
          this.isRoleUserStandar = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_STANDARD, data.user_role, id, dataCustomUserPolicies
          );
          this.isRoleUserMinimum = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_MINIMUM, data.user_role, id, dataCustomUserPolicies
          );
          this.isRoleUserDataDl = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_DATA_DL, data.user_role, id, dataCustomUserPolicies
          );
        }
      }
    })
  }

  openPopupModal(isUploadMode) {
    const dialogRef = this.dialog.open(PopupVideoDetailComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {
        listFolder: this.listFolder,
        projectId: this.projectId,
        isUploadMode
      },
      disableClose: true,
      autoFocus: false,
      panelClass: 'upload-dialog-class',
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.insertVideoData(data);
      }
    });
  }

  getDocument() {
    this.dialog.open(PopupDocumentComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {
        projectId: this.projectId
      },
      disableClose: true,
      autoFocus: false,
      panelClass: 'document-dialog-class',
    });
  }

  catchError(err) {
    this.spinner.hide();
  }

  insertVideoData(data: { folderId: number; video: VideoModel }) {
    const folderModel = this.listFolder.find(folder => folder.id === +data.folderId);
    if (folderModel) {
      if (
        (folderModel.totalElementsFolder % ROWS_PER_PAGE_FOLDER === 0 && folderModel.totalElementsFolder !== 0) ||
        folderModel.showMore
      ) {
        folderModel.showMore = true;
        folderModel.videoData.splice(folderModel.videoData.length - 1);
      }
      folderModel.videoData.unshift(data.video);
      folderModel.totalElementsFolder += 1;
    }
  }

  loadMore(folderId: number) {
    const folderModel = this.listFolder.find(folder => folder.id === folderId);
    folderModel.currentPage = this.numCurPage;
    if (folderModel) {
      this.videoManagementService
        .getListVideoByFolder(folderModel.id, folderModel.currentPage, this.currentSortTypeVideo)
        .subscribe(videos => {
          folderModel.videoData = folderModel.videoData.concat((videos && videos.content) || []);
          folderModel.totalElementsFolder = Number(videos.totalElementsFolder);
          if (folderModel.videoData.length === folderModel.totalElementsFolder) {
            folderModel.showMore = false;
          }
        }, this.catchError.bind(this));
    }
  }

  deleteVideoDetail(data) {
    this.afterVideoDelete.emit();
    // location.reload();
    // const { videoDetailId, folderId } = data;
    // if (videoDetailId) {
    //   const folderModel = this.listFolder.find(folder => folder.id === folderId);
    //   if (folderModel) {
    //     folderModel.videoData = folderModel.videoData.filter(video => video.id !== videoDetailId);
    //     folderModel.totalElementsFolder -= 1;
    //     if (folderModel.showMore) {
    //       // When get list video on this delete process we pass default sorting type
    //       this.videoManagementService.getListVideoByFolder(folderId, folderModel.currentPage,0).subscribe(videoDatas => {
    //         folderModel.totalElementsFolder = videoDatas.totalElementsFolder;
    //         if (videoDatas && videoDatas.content && videoDatas.content.length > 0) {
    //           folderModel.videoData.push(videoDatas.content[videoDatas.content.length - 1]);
    //         }
    //         if (folderModel.videoData.length < videoDatas.totalElementsFolder) {
    //           folderModel.showMore = true;
    //         } else {
    //           folderModel.showMore = false;
    //         }
    //       });
    //     }
    //   }
    // }
  }

  get isShowUpload() {
    // for (const role of this.userRole) {
    //   if (+this.userPrivileges[role.privileges[0]] >= this.userPrivileges.EDITOR) {
    //     return true;
    //   }
    // }
    if (this.userRole && this.userRole.length > 0 && this.isAdmin) {
      return true;
    }
    return false;
  }

  changeSortOption(): void {
    this.currentSortType.emit(this.sortingConditionFolder.key || 0);
    this.reGetFolderListOfProject(this.projectId, this.projectName, this.sortingConditionFolder.key);
  }

  getCurrentSortTypeVideo(event: number): void {
    this.currentSortTypeVideo = event;
  }

  changeShowMoreCurrentPage(event: number) {
    this.numCurPage = event;
  }

  openPopupCopyVideoModal() {
    const dialogRef = this.dialog.open(PopupCopyVideoComponent, {
      width: '50%',
      minWidth: '786px',
      maxWidth: '786px',
      data: {
        listFolder: this.listFolder,
        projectId: this.projectId
      },
      disableClose: true,
      panelClass: 'video-custom-dialog-class'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.copyDone.emit(true);
      }
    });
  }

  openPopupExport(){
    this.dialog.open(PopupExportComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {
        listFolder: this.listFolder,
        projectId: this.projectId
      },
      disableClose: true,
      panelClass: 'export-data-dialog-class'
    });
  }
}

