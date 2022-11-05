import { ToastrService } from 'ngx-toastr';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FolderModel } from '@app/shared/models/videoManagementModel';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ROLE_NEW_TYPE, sortingOptions } from '@app/configs/app-constants';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { environment } from '@environments/environment';
import { DateUtil } from '@app/shared/utils/date';
import { forkJoin } from 'rxjs';
import { CheckUserPermission } from '@app/shared/utils/common';
import { HeaderService } from '@app/core/services/component-services/header.service';

@Component({
  selector: 'app-folder-list',
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.scss']
})
export class FolderListComponent implements OnInit {
  @Input() folder: FolderModel;
  @Input() proActId: number;
  @Output() deleteVideoDetailPopup: EventEmitter<any> = new EventEmitter();
  @Output() loadMore: EventEmitter<any> = new EventEmitter();
  @Output() currentSortTypeVideo: EventEmitter<number> = new EventEmitter<number>();
  @Output() hasChoseSortVideo: EventEmitter<boolean> = new EventEmitter<boolean>();
  userRole: any[];
  sortingConditionVideo;
  sortingOptions = sortingOptions;
  numCurPage = 1;
  @Output() currentPage: EventEmitter<number> = new EventEmitter<number>();
  constructor(
    private videoManagementService: VideoManagementService,
    private spinner: SpinnerService,
    private toast: ToastrService,
    private userRoleService: UserRoleService,
    private dateUtil: DateUtil,
    private headerService: HeaderService
  ) {}

  ngOnInit() {
    this.userRoleService.userRole.subscribe((role) => (this.userRole = role));
    this.currentSortTypeVideo.emit(0);
    this.currentPage.emit(this.numCurPage);
  }

  showMore() {
    this.currentPage.emit(++this.numCurPage);
    this.loadMore.emit(this.folder.id);
  }
  catchError(err: { message: any }) {
    this.spinner.hide();
    this.toast.error(err.message || err);
  }
  deleteVideoDetail(data) {
    if (data) {
      this.deleteVideoDetailPopup.emit(data);
    }
  }

  changeSortOption(): void {
    this.hasChoseSortVideo.emit(true);
    this.currentSortTypeVideo.emit(this.sortingConditionVideo.key);
    this.folder.videoData = [];
    const forkJoinList = [];
    for (let curPage = 1; curPage <= this.numCurPage; curPage++) {
      forkJoinList.push(
        this.videoManagementService.getListVideoByFolder(this.folder.id, curPage, this.sortingConditionVideo.key)
      );
    }
    forkJoin(forkJoinList).subscribe((videoListResponse) => {
      for (const video of videoListResponse) {
        if (video && video.content) {
          video.content.map(
            (v) => (v.additionalDate = this.dateUtil.convertTimeZone(v.additionalDate, environment.timeZone))
          );
          // this.folder.videoData = this.folder.videoData || [];
          this.folder.videoData = this.folder.videoData.concat(video.content);
          this.folder.totalElementsFolder = Number(video.totalElementsFolder);
          this.folder.showMore = this.folder.videoData.length !== video.totalElementsFolder;
        }
      }
    });
  }
}
