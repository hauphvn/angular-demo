import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VideoModel } from '@app/shared/models/videoManagementModel';
import { Router } from '@angular/router';
import { UIPATH, userPrivileges } from '@app/configs/app-constants';
import { MatDialog } from '@angular/material';
import { PopupVideoDetailComponent } from '../popup-video-detail/popup-video-detail.component';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { DateUtil } from '@app/shared/utils/date';
import { environment } from '@environments/environment';
import { HeaderService } from '@app/core/services/component-services/header.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit {
  @Input() video: VideoModel;
  @Input() folderId: number;
  @Output() deleteVideoDetailPopup: EventEmitter<any> = new EventEmitter();
  imageNoVideo = '../../../../../assets/images/noVideo.png';
  userPrivileges = userPrivileges;
  userRole: any[];
  scaleWidth;
  scaleHeight;
  date = this.dateUtil.convertTimeZone(new Date().toUTCString(), environment.timeZone);
  isAdmin = false;
  constructor(
    private router: Router,
    public dialog: MatDialog,
    private managementService: VideoManagementService,
    private spinner: SpinnerService,
    private dialogService: DialogService,
    private dateUtil: DateUtil,
    private userRoleService: UserRoleService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    if (this.video.thumbnail == null) {
      this.video.thumbnail = this.imageNoVideo;
      this.scaleWidth = '100%';
      this.scaleHeight = 'auto';
    } else {
      this.scaleImage(this.video.thumbnail);
    }
    this.userRoleService.userRole.subscribe(role => (this.userRole = role));
    this.headerService.roleAccount.subscribe(data => {
      this.isAdmin = data;
    });
    this.headerService.userManagementRole.subscribe(roleData => {

    });
  }

  handleMouseEnter(event) {
    const { parentElement } = event.target;
    if (!parentElement.classList.contains('active')) {
      parentElement.classList.add('active');
    }
    event.target.previousSibling.style.height = event.target.getBoundingClientRect().height + 'px';
  }
  handleMouseLeave(event) {
    const { parentElement } = event.target;
    if (parentElement.classList.contains('active')) {
      parentElement.classList.remove('active');
    }
  }
  openDialog() {
    const dialogRef = this.dialog.open(PopupVideoDetailComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {
        videoDetailId: this.video.id,
        folderId: this.folderId,
        isUploadMode: false,
      },
      disableClose: true,
      autoFocus: false,
      panelClass: 'video-detail-dialog-class',
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        if (data.videoTitle) {
          this.video.title = data.videoTitle;
        }
        this.video.thumbnail = data.thumbnail || this.imageNoVideo;
        this.scaleImage(this.video.thumbnail);
        if (data.isDelete) {
          this.deleteVideoDetailPopup.emit(data);
        }
      }
    });
  }
  goToDashboard() {
    this.spinner.show();
    this.managementService.getVideoDetailById(this.video.id).subscribe(
      result => {
        if (result) {
          this.spinner.hide();
          this.router.navigate([`/${UIPATH.DASHBOARD}`], { queryParams: { videoID: this.video.id } });
        } else {
          this.spinner.hide();
          const param = {
            type: 'info',
            title: 'INFORM',
            message: 'You do not have permission'
          };
          this.dialogService.info(param).subscribe(response => {
            if (response) {
              location.reload();
            }
          });
        }
      },
      err => {
        this.spinner.hide();
        const param = {
          type: 'info',
          title: 'INFORM',
          message: 'Video data title does not exist on system'
        };
        this.dialogService.info(param).subscribe(res => {
          if (res) {
            location.reload();
          }
        });
      }
    );
  }

  scaleImage(image) {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      if (img.width > img.height) {
        this.scaleWidth = '100%';
        this.scaleHeight = 'auto';
      } else {
        this.scaleWidth = '32%';
        this.scaleHeight = 'auto';
      }
    };
    img.onerror = () => {
      this.video.thumbnail = '../../../../../assets/images/black-image.png';
      const defaultImg = new Image();
      defaultImg.src = '../../../../../assets/images/black-image.png';
      defaultImg.onload = () => {
        if (defaultImg.width > defaultImg.height) {
          this.scaleWidth = '100%';
          this.scaleHeight = 'auto';
        } else {
          this.scaleWidth = '32%';
          this.scaleHeight = 'auto';
        }
      };
    };
  }
}
