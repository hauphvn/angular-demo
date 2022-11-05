import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectModel, FolderModel } from '@app/shared/models/videoManagementModel';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { userPrivileges, messageConstant, sortingOptions, NAVIGATE } from '@app/configs/app-constants';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from '@app/core/services/component-services/router.service';
import { UIPATH } from '@app/configs/app-constants';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@environments/environment';
import { DateUtil } from '@app/shared/utils/date';
import { Dropdown } from 'primeng/dropdown';
import { HeaderService } from '@app/core/services/component-services/header.service';

@Component({
  selector: 'app-video-management',
  templateUrl: './video-management.component.html',
  styleUrls: ['./video-management.component.scss']
})
export class VideoManagementComponent implements OnInit, OnDestroy {
  constructor(
    private videoManagementService: VideoManagementService,
    private spinner: SpinnerService,
    private userRoleService: UserRoleService,
    private routerService: RouterService,
    private route: ActivatedRoute,
    private dateUtil: DateUtil,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {}

  projectList: ProjectModel[] = [];
  projectName: string;
  projectId: number;
  // total project
  totalElements: number;
  // items per page
  size: number;
  listFolder: FolderModel[] = [];
  showPagination = false;
  currentPage = 1;
  currentSort = 0;
  userRole: any[];
  // userPrivileges = userPrivileges;
  previousUrl: string;
  isBack: boolean;
  sortingConditionProject;
  sortingOptions = sortingOptions;
  folderSortTypeCurrent = 0;
  isAdmin = false;

  ngOnInit() {
    this.isBack = this.routerService.getIsBackFromDashboard();
    this.routerService.setIsBackFromDashboard(false);
    this.previousUrl = this.routerService.getPreviousUrl();
    this.projectId = +localStorage.getItem('currentProjectId');
    this.headerService.projectIdActice.next(this.projectId);
    this.currentPage =
      +localStorage.getItem('currentProjectPage') && this.isBack && this.previousUrl.length > 0
        ? +localStorage.getItem('currentProjectPage')
        : 1;
    // Default when init loading, sorting option is old to from
    this.getProjectByCurrentPage(this.currentPage, this.currentSort);
    this.headerService.roleAccount.subscribe(data => {
      this.isAdmin = data;
    });
    if (!this.isBack) {
      localStorage.setItem('currentProjectPage', this.currentPage.toString());
    }
  }

  /**
   *
   * @param currentPage : get value of current page
   * @param sortingBy : get value of enum SORTING
   */
  getProjectByCurrentPage(currentPage: number, sortType: number) {
    // API call
    this.spinner.show();
    this.videoManagementService.getProjectByCurrentPage(currentPage, sortType).subscribe(
      data => {
        if (data && data.content && data.content.length > 0) {
          this.projectList = data.content;
          const indexProjectInList = this.projectList.findIndex(project => +project.id === +this.projectId);
          if (
            this.projectId &&
            this.previousUrl.length > 0 &&
            (this.previousUrl.includes(`/${UIPATH.DASHBOARD}`) || this.previousUrl.includes(`/${NAVIGATE.REPORTING}`)) &&
            this.isBack &&
            indexProjectInList !== -1
          ) {
            this.projectName = this.projectList[indexProjectInList].name;
          } else {
            // ProjectId not exist
            this.projectId = this.projectList[0].id;
            this.headerService.projectIdActice.next(this.projectId);
            this.projectName = this.projectList[0].name;
          }
          localStorage.setItem('currentProjectId', String(this.projectId));
          this.getFolderInProject(this.projectId, this.projectName, this.folderSortTypeCurrent);
          this.totalElements = data.totalElements;
          this.size = data.size;
          if (data.totalPages > 1) {
            this.showPagination = true;
          }
        }
        this.spinner.hide();
      },
      errorResponse => {
        this.spinner.hide();
      }
    );
  }

  getFolderInProject(projectId: number, projectName: string, sortType: number) {
    this.projectName = projectName;
    // API call
    this.spinner.show();
    this.videoManagementService.getListFolderInProject(projectId, sortType).subscribe(
      folders => {
        if (folders) {
          this.listFolder = folders;
          if (this.listFolder) {
            this.userRole = this.listFolder.map(folder => {
              // return { folderID: folder.id, privileges: folder.privileges };
              return { folderID: folder.id };
            });
            this.listFolder = this.listFolder.filter(folder => {
              return (this.userRole.findIndex(role => role.folderID === folder.id) !== -1);
            });
          } else {
            this.userRole = [];
          }
          this.userRoleService.userRole.next(this.userRole);
          this.listFolder.forEach(folder => {
            folder.currentPage = folder.currentPage || 1;
            // When get list video on this process we pass default sorting type
            this.videoManagementService.getListVideoByFolder(folder.id, folder.currentPage, 0).subscribe(video => {
              if (video && video.content) {
                video.content.map(
                  v => (v.additionalDate = this.dateUtil.convertTimeZone(v.additionalDate, environment.timeZone))
                );
                folder.videoData = folder.videoData || [];
                folder.videoData = folder.videoData.concat(video.content);
                folder.showMore = true;
                folder.totalElementsFolder = Number(video.totalElementsFolder);
                if (folder.videoData.length === video.totalElementsFolder) {
                  folder.showMore = false;
                }
              }
            });
          });
        }
        this.spinner.hide();
      },
      errorResponse => {
        this.toastr.error(messageConstant.VIDEO_MANAGEMENT.PROJECT_NOT_EXIST);
        this.spinner.hide();
      }
    );
  }

  paginate(event) {
    this.currentPage = event.page + 1;
    localStorage.setItem('currentProjectPage', this.currentPage.toString());
    this.getProjectByCurrentPage(this.currentPage, this.currentSort);
  }

  projectClick(project: ProjectModel) {
    if (+this.projectId !== +project.id) {
      this.projectId = project.id;
      this.headerService.projectIdActice.next(this.projectId);
      localStorage.setItem('currentProjectId', String(this.projectId));
      this.projectName = project.name;
      this.getFolderInProject(this.projectId, this.projectName, this.folderSortTypeCurrent);
    }
  }

  // Select option of sorting on projects
  changeSortOption(): void {
    this.currentSort = this.sortingConditionProject.key;
    this.getProjectByCurrentPage(this.currentPage, this.currentSort);
  }

  ngOnDestroy(): void {}

  getSortTypeCurrentFolder(event: number): void {
    this.folderSortTypeCurrent = event;
  }

  getCopyDone(event: any) {
    if (event) {
      this.getFolderInProject(this.projectId, this.projectName, 0);
    }
  }

  handleAfterDeleteVideo() {
    this.getFolderInProject(this.projectId, this.projectName, this.folderSortTypeCurrent);
  }
}
