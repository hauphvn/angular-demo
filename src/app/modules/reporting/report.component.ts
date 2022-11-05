import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { JwtInterceptor } from './../../core/interceptors/jwt.interceptor';
import { CheckUserPermission, CommonUtil } from '@app/shared/utils/common';
import { apiPathConstant, REPORTING_RESPONSE, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { environment } from '@environments/environment';
import { EXPORT, PUSHER_EVENT, HTTP_STATUS_CODE, REPORTING_FORMAT } from './../../configs/app-constants';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { ReportingPreviewComponent } from './components/reporting-preview/reporting-preview.component';
import { ReportService } from '@app/core/services/server-services/report.service';
import { Location } from '@angular/common';
import { PopupValidateExportComponent } from './components/popup-validate-export/popup-validate-export.component';

import { FormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { catchError, map, startWith } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatDialog, MatRadioChange } from '@angular/material';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import * as c3 from 'c3';
import * as d3 from 'd3';
import pusher from 'pusher-js';
import { ToastrService } from 'ngx-toastr';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { ReportingPreviewModel } from '@app/shared/models/reportModel';
import { DateUtil } from '@app/shared/utils/date';
import { RouterService } from '@app/core/services/component-services/router.service';
import { Router } from '@angular/router';
import { NAVIGATE } from '@app/configs/app-constants';


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReportComponent implements OnInit, OnDestroy {
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  separatorKeysCodes = [ENTER, COMMA];
  projectCtrl = new FormControl();
  filteredProjects: Observable<any[]>;
  listObjProjects = [];
  projects = [];
  allProject = [];
  videoSets = [];
  allVideoSetIdsSelect = [];
  scenes = [];
  tags = [];
  sceneTagSelected = {
    tags: [],
    scenes: [],
    videoSets: []
  };
  sceneTagToPreview: any;
  reportPreviewModels: ReportingPreviewModel[] = [];
  headerTable = [];
  headerVideo = [];
  tableData = [];
  dataReport;
  tabIndex = 0; // default first tab
  frozenCols = [{ field: '', header: '' }];

  widthBarChart = 15;
  colorConstants = [
    '#6BBED5',
    '#68CFC3',
    '#64C99B',
    '#81D674',
    '#CFE283',
    '#EBF182',
    '#FFF280',
    '#FBE481',
    '#F6D580',
    '#EDA184',
    '#E38692',
    '#DF81A2',
    '#DB7BB1',
    '#D27EB3',
    '#C97FB4',
    '#B492CC',
    '#A4A9CF',
    '#8BA7D5',
    '#6EB7DB',
    '#6CBAD8'
  ];

  channelName: string;
  pusher: pusher;
  pusherKey;
  isRoleAdmin = false;
  isRoleUserPro = false;
  isRoleUserUploader = false;
  isRoleUserStandar = false;
  isRoleUserMinimum = false;
  isRoleUserDataDl = false;

  REPORTING_FORMAT = REPORTING_FORMAT;
  // Data for opions
  headerVideoFullTime = [];
  headerVideoSec = [];
  dataTimeSec = [];
  dataTimeFullTime = [];
  timeFormatOption = REPORTING_FORMAT.TIME_FORMAT.SEC;

  dataGroup = [];

  @ViewChild('projectInput', { static: false }) projectInput: ElementRef;
  @ViewChild('divScene', { static: false }) divScene: ElementRef;
  @ViewChild('divTag', { static: false }) divTag: ElementRef;

  constructor(
    private reportService: ReportService,
    private spinner: SpinnerService,
    public dialog: MatDialog,
    private ganttLineService: GanttLineService,
    private toastr: ToastrService,
    private _location: Location,
    private authenticationService: AuthenticationService,
    private jwtInterceptor: JwtInterceptor,
    private headerService: HeaderService,
    private dateUtil: DateUtil,
    private routerService: RouterService,
    private router: Router,
  ) {
    this.filteredProjects = this.projectCtrl.valueChanges.pipe(
      startWith(null),
      map((projectName: string | null) => (projectName ? this.filter(projectName) : this.allProject.slice()))
    );
    this.ganttLineService.ganttResize = new ReplaySubject<number>(1);
    this.ganttLineService.ganttTimeRangeChange = new ReplaySubject<number>(1);
    this.ganttLineService.startToMiddleRangeChange = new ReplaySubject<number>(1);
    this.ganttLineService.ganttZoom = new ReplaySubject<number>(1);
  }

  ngOnInit() {
    this.spinner.show();
    this.reportService.getListProject().subscribe(
      res => {
        this.allProject = res;
        this.spinner.hide();
      },
      () => {
        this.spinner.hide();
      }
    );
  }

  checkShowReporting(id) {
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0 && id) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
        );
        if (!this.isRoleAdmin) {
          const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], id);
          const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(id, data.user_policies);
          const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy,
            (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
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

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    const project = this.allProject.find(x => x.name.toLowerCase() === value.toLowerCase());
    if (project) {
      this.projects.push(project);
      this.allProject = this.allProject.filter(x => x.id !== project.id);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.projectCtrl.setValue(null);
  }

  remove(project: any): void {
    const index = this.projects.indexOf(project);
    if (index >= 0) {
      this.projects.splice(index, 1);
      this.filterSceneTagSelected();
    }
  }

  filter(projectName: any) {
    return this.allProject.filter(el => el.name.toLowerCase().indexOf(projectName.toLowerCase()) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const { id } = event.option;
    this.checkShowReporting(id);
    this.headerService.projectIdActice.next(id);
    const project = this.allProject.find(x => x.id === +id);
    if (!this.projects.some(el => el.id === project.id)) {
      this.projects.push(project);
    }
    this.projectInput.nativeElement.value = '';
    this.projectInput.nativeElement.blur();
    this.projectCtrl.setValue(null);
  }

  getListObjProjects(event: any) {
    const index = this.listObjProjects.findIndex(item => +item.projectId === +event.projectId);
    if (index === -1) {
      this.listObjProjects.push(event);
    } else {
      this.listObjProjects.splice(index, 1);
      this.sceneTagSelected.scenes = this.sceneTagSelected.scenes.filter(scene => !event.sceneAfterChangeVideoSet.includes(scene));
      this.sceneTagSelected.tags = this.sceneTagSelected.tags.filter(tag => !event.tagAfterChangeVideoSet.includes(tag));
      this.listObjProjects.push(event);
    }
    this.filterSceneTagSelected();
  }

  tagSelect(event: any) {
    if (event.selectAll === true) {
      if (event.add) {
        this.sceneTagSelected.tags = [...this.sceneTagSelected.tags, ...event.value];
      } else {
        this.sceneTagSelected.tags = this.sceneTagSelected.tags.filter(item => !event.value.includes(item));
      }
    } else {
      if (event.add) {
        if (!this.sceneTagSelected.tags.includes(event.value)) {
          this.sceneTagSelected.tags.push(event.value);
        }
      } else {
        if (this.sceneTagSelected.tags.includes(event.value)) {
          this.sceneTagSelected.tags.splice(this.sceneTagSelected.tags.indexOf(event.value), 1);
        }
      }
    }
    this.filterSceneTagSelected();
  }

  sceneSelect(event: any) {
    if (event.selectAll === true) {
      if (event.add) {
        this.sceneTagSelected.scenes = [...this.sceneTagSelected.scenes, ...event.value];
      } else {
        this.sceneTagSelected.scenes = this.sceneTagSelected.scenes.filter(item => !event.value.includes(item));
      }
    } else {
      if (event.add) {
        if (!this.sceneTagSelected.scenes.includes(event.value)) {
          this.sceneTagSelected.scenes.push(event.value);
        }
      } else {
        if (this.sceneTagSelected.scenes.includes(event.value)) {
          this.sceneTagSelected.scenes.splice(this.sceneTagSelected.scenes.indexOf(event.value), 1);
        }
      }
    }
    this.filterSceneTagSelected();
  }

  videoSelect(data: any) {
    if (data) {
      const video = data.item;
      if (data.selectAll && data.selectAll.status === true) {
        if (data.selectAll.completed === true) {
          this.sceneTagSelected.videoSets = [...this.sceneTagSelected.videoSets, ...video];
          this.sceneTagSelected.videoSets = this.removeObjSame(this.sceneTagSelected.videoSets, video);
        } else {
          this.sceneTagSelected.videoSets = this.sceneTagSelected.videoSets.filter(item => item.checked);
          this.sceneTagSelected.videoSets = this.removeObjSame(this.sceneTagSelected.videoSets, video);
        }
      } else {
        if (video) {
          if (this.sceneTagSelected.videoSets.some((item) => item.id === video.id)) {
            this.sceneTagSelected.videoSets = this.sceneTagSelected.videoSets.filter((item) => item.id !== video.id);
            this.allVideoSetIdsSelect = this.allVideoSetIdsSelect.filter(vId => +vId !== +video.id);
          } else {
            if (video.checked) {
              this.sceneTagSelected.videoSets.push(video);
              this.allVideoSetIdsSelect.push(video.id);
            }
          }
        } else {
          this.sceneTagSelected.videoSets = [];
          this.sceneTagSelected.scenes = [];
          this.sceneTagSelected.tags = [];
        }
      }
    }
  }

  removeObjSame(arr1, arr2) {
    const objArr1Ids = arr1.map(o => o.id);
    const arr1Filter = arr1.filter(({ id }, index) => !objArr1Ids.includes(id, index + 1));
    const objIds = arr2.map(o => o.id);
    const dataFilter = arr1Filter.filter(({ id }, index) => !objIds.includes(id, index + 1));
    return dataFilter;
  }

  showData() {
    this.filterSceneTagSelected();
    this.spinner.show();
    this.reportService.getReportData(this.sceneTagSelected).subscribe(
      res => {
        this.dataReport = res;
        this.generateTable(this.dataReport);
        this.selectedTab(this.tabIndex);
        this.mapDataReportToPreview(this.dataReport);
      },
      (error) => {
        const messageCode = error.error.message.substr(0, error.error.message.indexOf(':'));
        switch (messageCode) {
          case REPORTING_RESPONSE.CODE.REPORTING_01:
            this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_01);
            break;
          case REPORTING_RESPONSE.CODE.REPORTING_02:
            this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_02);
            break;
          case REPORTING_RESPONSE.CODE.REPORTING_03:
            this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_03);
            break;
        }
        this.spinner.hide();
      }
    );
  }

  generateTable(data) {
    const headerTable = [];
    const headerVideo = [];
    data.scene_tags_report.forEach(element => {
      const col = [
        {
          header: 'Scene',
          field: `${element.name}-scene`,
          merge: true,
          total: element.total_time
        },
        {
          header: 'Tag',
          field: `${element.name}-tag`,
          merge: false,
          total: element.total_time
        }
      ];
      const colgroup = {
        header: element.name,
        total: element.total_time,
        colspan: 2
      };
      headerTable.push(...col);
      headerVideo.push(colgroup);
    });

    this.formatDataForOptions(headerVideo, data);
    this.headerTable = headerTable;
    switch (this.timeFormatOption) {
      case REPORTING_FORMAT.TIME_FORMAT.SEC:
        this.headerVideo = this.headerVideoSec;
        this.tableData = this.genDataTable(data);
        break;
      case REPORTING_FORMAT.TIME_FORMAT.FULL_TIME:
        this.headerVideo = this.headerVideoFullTime;
        this.tableData = this.genDataTable(data, REPORTING_FORMAT.TIME_FORMAT.FULL_TIME);
        break;
      default:
        break;
    }
    // this.headerVideo = headerVideo;
  }

  /**
   * Gen config chart
   * @param data data API
   * @param id ID Div HTML gen Chart
   * @param dataType TypeData: time, count, average, percentage
   * @returns config chart
   */
  configTimeChart(data: any, id: string, dataType: string) {
    const videoName = [];
    data.scenes_report.forEach(element => {
      videoName.push(element.name);
    });
    const dataChart = [];
    this.dataGroup = [];
    data.scenes.forEach((element, index) => {
      const scene = [];
      scene.push(element);
      this.dataGroup.push(element);
      data.scenes_report.forEach(el => {
        switch (dataType) {
          case 'count':
            scene.push(el.values[index].count);
            break;
          case 'time':
            scene.push(el.values[index].time);
            break;
          case 'average':
            scene.push(el.values[index].average);
            break;
          case 'percentage':
            scene.push(el.values[index].percentage);
            break;
          default:
            scene.push(el.values[index].count);
            break;
        }
      });
      dataChart.push(scene);
    });
    const config = {
      bindto: `#${id}`,
      data: {
        columns: dataChart,
        type: 'bar',
        groups: dataType === 'percentage' ? [this.dataGroup] : []
      },
      color: {
        pattern: this.colorConstants
      },
      bar: {
        width: this.widthBarChart,
        space: 0.15
      },
      axis: {
        rotated: true,
        x: {
          tick: {
            format: x => {
              return videoName[x];
            },
            multiline: true,
            multilineMax: 2,
          },
        }
      },
      size: {
        height:
          dataType === 'percentage'
            ? 120 + this.widthBarChart * videoName.length
            : 120 + this.widthBarChart * this.dataGroup.length * videoName.length
      },
      tooltip: {
        format: {
          value: value => {
            switch (dataType) {
              case 'count':
                return value;
              case 'time':
                return d3.format(',.1f')(value);
              case 'average':
                return d3.format(',.1f')(value);
              case 'percentage':
                return d3.format(',.1f')(value);
              default:
                return value;
            }
          }
        }
      },
      grid: {
        x: {
          lines: videoName.map((video, index) => {
            return { value: index + 0.5, class: 'custom-grid' };
          })
        }
      },
      legend: {
        show: false
      }
    };
    return config;
  }

  generateTimeChart(config) {
    const chart = c3.generate(config);
    this.customLegend(chart, config.bindto);
  }

  customLegend(chart, idChart) {
    const dataLegend = [];
    const arrClone = JSON.parse(JSON.stringify(this.dataGroup));
    for (let i = 0; i < arrClone.length; i += 5) {
        dataLegend.push(arrClone.slice(i, i + 5));
    }
    const legendColumn = d3.select(idChart).insert('div', '.chart').attr('class', 'legend d-flex').selectAll('div')
      .data(dataLegend)
      .enter()
      .append('div').attr('class', 'legend-column');

    const legendItem = legendColumn.selectAll('.legend-column')
      .data((d) => {
        return d;
      })
      .enter()
      .append('div').attr('class', 'legend-item d-flex align-items-center');

    legendItem.append('label')
      .attr('class', 'legend-item-color')
      .html(() => {
        return '&nbsp';
      });

    legendItem.append('label')
      .attr('class', 'legend-item-label m-0 text-truncate')
      .text(id => {
        return id;
      });
    d3.selectAll('.legend-item-color')
    .each((id, index) => {
      d3.selectAll('.legend-item-color').filter((d, i) => i === index).style('background-color', chart.color(id));
    });
    legendItem.on('mouseover', (id) => {
      chart.focus(id);
    })
    .on('mouseout', () => {
      chart.revert();
    })
    .on('click', (id) => {
      chart.toggle(id);
    });
  }

  selectedTab(event) {
    this.tabIndex = event;
    this.spinner.show();
    switch (event) {
      case 0:
        setTimeout(() => {
          this.generateTimeChart(this.configTimeChart(this.dataReport, 'count-chart', 'count'));
          this.spinner.hide();
        }, 1000);
        break;
      case 1:
        setTimeout(() => {
          this.generateTimeChart(this.configTimeChart(this.dataReport, 'time-chart', 'time'));
          this.spinner.hide();
        }, 1000);
        break;
      case 2:
        setTimeout(() => {
          this.generateTimeChart(this.configTimeChart(this.dataReport, 'average-chart', 'average'));
          this.spinner.hide();
        }, 1000);
        break;
      case 3:
        setTimeout(() => {
          this.generateTimeChart(this.configTimeChart(this.dataReport, 'percentage-chart', 'percentage'));
          this.spinner.hide();
        }, 1000);
        break;
      default:
        break;
    }
  }

  private filterSceneTagSelected() {
    // this.getSceneTagChangeVideoSet();
    if (this.projects.length === 0) {
      this.sceneTagSelected.videoSets = [];
      this.sceneTagSelected.scenes = [];
      this.sceneTagSelected.tags = [];
      return;
    }
    
    const videoSets = [];
    const scenesMustHave = [];
    const tagsMustHave = [];
    let isEmptyVideoSet = false;
    this.listObjProjects.forEach(project => {
      isEmptyVideoSet = true;
      if (this.projects.findIndex(item => +item.id === +project.projectId) >= 0) {
        project.folders.forEach(folder => {
          if (isEmptyVideoSet) {
            isEmptyVideoSet = folder.videoSetsId.length === 0;
          }
          folder.videoSetsId.forEach((video) => videoSets.push(video));
        });
        project.sceneAfterChangeVideoSet.forEach(sce => {
          scenesMustHave.indexOf(sce) === -1 && !isEmptyVideoSet ? scenesMustHave.push(sce) : '';
        });
        project.tagAfterChangeVideoSet.forEach(tag => {
          tagsMustHave.indexOf(tag) === -1 && !isEmptyVideoSet ? tagsMustHave.push(tag) : '';
        });
      }
    });
    if (videoSets.length > 0) {
      const uniqueVideoSets = Array.from(new Set(videoSets.map(v => v.id)))
        .map(id => {
          return videoSets.find(v => v.id === id)
        })
      this.sceneTagSelected.videoSets = uniqueVideoSets.filter(item => item.checked);
      if (scenesMustHave.length > 0 || tagsMustHave.length > 0) {
        this.sceneTagSelected.scenes = scenesMustHave;
      } else {
        this.sceneTagSelected.scenes = [];
      }
      if (tagsMustHave.length > 0 || scenesMustHave.length > 0) {
        this.sceneTagSelected.tags = tagsMustHave;
      } else {
        this.sceneTagSelected.tags = [];
      }
    } else {
      this.sceneTagSelected.scenes = [];
      this.sceneTagSelected.tags = [];
    }
  }

  handleClickScene(initSceneName: string, sceneItem: any) {
    this.sceneTagToPreview = JSON.parse(JSON.stringify(this.sceneTagSelected));
    for (const [key, value] of Object.entries(sceneItem)) {
      // const sceneTagIndex = this.sceneTagSelected.videoSets.findIndex((video) => video.name === key);
      const sceneTagIndex = this.sceneTagToPreview.videoSets.findIndex((video) => video.name === key);
      if (sceneTagIndex !== -1 && value === 0) {
        this.sceneTagToPreview.videoSets.splice(sceneTagIndex, 1);
      }
    }
    this.dialog
      .open(ReportingPreviewComponent, {
        width: '95%',
        maxWidth: '95%',
        height: '95%',
        data: {
          ...this.sceneTagToPreview,
          sceneSelected: initSceneName,
          previewModels: this.reportPreviewModels,
          scenes: this.dataReport.scenes
        },
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => { });
  }

  getSceneTagChangeVideoSet(event: any) {
    this.listObjProjects.forEach(itemProject => {
      if (+itemProject.projectId === +event.projectId) {
        itemProject.sceneAfterChangeVideoSet = event.scenes;
        itemProject.tagAfterChangeVideoSet = event.tags;
        return;
      }
    });
    this.filterSceneTagSelected();
  }

  getStyle() {
    let scaleWidth;
    if (this.dataReport.scene_tags_report.length > 5) {
      scaleWidth = '100%';
      return {
        width: scaleWidth
      };
    } else {
      scaleWidth = this.dataReport.scene_tags_report.length * 300 +
        300 +
        this.dataReport.scene_tags_report.length;
      return {
        width: `${scaleWidth + 8}px`
      };
    }
  }

  handleValidateExport() {
    if (this.isRoleAdmin) {
      this.handleExportData();
    } else {
      if (this.isRoleUserDataDl) {
        const cloneVideos = JSON.parse(JSON.stringify(this.sceneTagSelected.videoSets));
        const dataVideoId = cloneVideos.map(({ id }) => id);
        this.spinner.show();
        this.reportService.getExportReportingValidate({ video_detail_ids: dataVideoId}).subscribe(res => {
          const invalidateVideoDetails = res.invalidate_video_details;
          const validateVideoDetails = res.validate_video_details;
          const dialogRef = this.dialog.open(PopupValidateExportComponent, {
            width: '100%',
            minWidth: '558px',
            maxWidth: '558px',
            data: {
              invalidateVideoDetails,
              validateVideoDetails
            },
            disableClose: true,
            panelClass: 'export-reporting-dialog-class'
          });
          this.spinner.hide();
          dialogRef.afterClosed().subscribe(data => {
            if (data) {
              this.handleExportData(validateVideoDetails);
            }
          });
        }, error => {
          this.spinner.hide();
        });
      }
    }
  }

  handleExportData(videosList = []) {
    this.reportService.getReportingChannelName().subscribe(({ channel_name, key }) => {
      this.channelName = channel_name;
      this.pusherKey = JSON.parse(key);
      this.createConnectionPusher(this.pusherKey.key, this.pusherKey.cluster);
      const exportData = {
        scenes: this.sceneTagSelected.scenes,
        tags: this.sceneTagSelected.tags,
        video_detail_ids: videosList && videosList.length > 0 ?
          videosList.map(({ id }) => id) : this.sceneTagSelected.videoSets.map(({ id }) => id)
      };

      this.spinner.show();
      const channel = this.pusher.subscribe(this.channelName);
      this.pusher.bind(PUSHER_EVENT.EXPORT_REPORTING, this.handleExportFile.bind(this));
      exportData['channel_name'] = this.channelName;
      channel.bind(PUSHER_EVENT.SUBSCRIPTION_SUCCEEDED, () => {
        this.reportService.exportData(exportData).subscribe();
      });
      channel.bind(PUSHER_EVENT.SUBSCRIPTION_ERROR, (error) => {
        this.handleError401(error);
      });
    },
      error => {
      }
    );
  }

  ngOnDestroy() {
    this.ganttLineService.ganttResize.unsubscribe();
    this.ganttLineService.ganttTimeRangeChange.unsubscribe();
    this.ganttLineService.startToMiddleRangeChange.unsubscribe();
    this.ganttLineService.ganttZoom.unsubscribe();
  }

  handleExportFile(response: any) {
    if (response.hasOwnProperty('status') && response.status === HTTP_STATUS_CODE.BAD_REQUEST) {
      const messageCode = response.message.substr(0, response.message.indexOf(':'));
      switch (messageCode) {
        case REPORTING_RESPONSE.CODE.EXPORT_REPORTING_01:
          this.toastr.error(REPORTING_RESPONSE.MESSAGE.EXPORT_REPORTING_01);
          break;
        case REPORTING_RESPONSE.CODE.EXPORT_REPORTING_10:
          this.toastr.error(REPORTING_RESPONSE.MESSAGE.EXPORT_REPORTING_10);
          break;
      }
    } else {
      CommonUtil.downloadFile(response);
    }
    this.pusher.unsubscribe(this.channelName);
    this.spinner.hide();
  }

  onGobackClicked() {
    this.routerService.setIsBackFromDashboard(true);
    this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
  }
  createConnectionPusher(key, cluster) {
    this.pusher = new pusher(key, {
      cluster,
      authEndpoint: `${environment.apiUrl}/${apiPathConstant.reportManagementController.EXPORT_REPORTING_PUSHER_AUTH}`,
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
        this.handleExportData();
      });
    }
  }

  private mapDataReportToPreview(dataReport: any) {
    this.sceneTagSelected.videoSets.forEach(videoSet => {
      const previewModel: ReportingPreviewModel = new ReportingPreviewModel();
      previewModel.videoSetId = videoSet.id;
      const index = dataReport.scenes_report.findIndex(item => item.name === videoSet.name);
      if (index > -1) {
        let posValue = 0;
        dataReport.scenes_report[index].values.forEach(value => {
          if (+value.count > 0) {
            previewModel.sceneNames.push(dataReport.scenes[posValue]);
          }
          ++posValue;
        });
      }
      this.reportPreviewModels.push(previewModel);
    });
  }

  // tagShowingChange(event: MatRadioChange) {
  //   switch (event.value) {
  //     case REPORTING_FORMAT.TAG.NO:

  //       break;
  //     case REPORTING_FORMAT.TAG.YES:
  //       break;
  //     default:
  //       break;
  //   }
  // }

  timeFormatChange(event: MatRadioChange) {
    switch (event.value) {
      case REPORTING_FORMAT.TIME_FORMAT.SEC:
        this.headerVideo = this.headerVideoSec;
        this.tableData = this.dataTimeSec;
        this.timeFormatOption = REPORTING_FORMAT.TIME_FORMAT.SEC;
        break;
      case REPORTING_FORMAT.TIME_FORMAT.FULL_TIME:
        this.headerVideo = this.headerVideoFullTime;
        this.tableData = this.dataTimeFullTime;
        this.timeFormatOption = REPORTING_FORMAT.TIME_FORMAT.FULL_TIME;
        break;
      default:
        break;
    }
  }

  formatDataForOptions(videoHeader, tableData) {
    this.convertHeaderFullTime(videoHeader);
    this.convertHeaderSec(videoHeader);
    this.converDataFullTime(tableData);
    this.convertDataTimeSec(tableData);
  }

  private convertHeaderFullTime(data) {
    this.headerVideoFullTime = data.map(item => {
      return {
        header: item.header,
        total: this.dateUtil.secondsToTimeFull(item.total),
        colspan: 2
      };
    });
  }

  private convertHeaderSec(data) {
    this.headerVideoSec = data;
  }

  private convertDataTimeSec(data) {
    this.dataTimeSec = this.genDataTable(data, REPORTING_FORMAT.TIME_FORMAT.SEC);
  }

  private converDataFullTime(data) {
    this.dataTimeFullTime = this.genDataTable(data, REPORTING_FORMAT.TIME_FORMAT.FULL_TIME);
  }

  private genDataTable(data, option = REPORTING_FORMAT.TIME_FORMAT.SEC) {
    const cloneData = JSON.parse(JSON.stringify(data));
    const tableData = [];
    cloneData.scene_tags.forEach((el, index) => {
      const count = cloneData.scene_tags.filter(item => item.scene === el.scene).length;
      const rowTable = {
        scene: el.scene,
        tag: el.tag,
        totalRow: count,
        indexRow: index
      };
      cloneData.scene_tags_report.forEach((element, index2) => {
        switch (option) {
          case REPORTING_FORMAT.TIME_FORMAT.SEC:

            break;
          case REPORTING_FORMAT.TIME_FORMAT.FULL_TIME:
            cloneData.scenes_report[index2].values[cloneData.scenes.findIndex(scene => scene === el.scene)].time =
              this.dateUtil.secondsToTimeFull(data.scenes_report[index2].values[
                cloneData.scenes.findIndex(scene => scene === el.scene)].time);
            cloneData.scene_tags_report[index2].values[index].time =
              this.dateUtil.secondsToTimeFull(data.scene_tags_report[index2].values[index].time);
            cloneData.scenes_report[index2].values[cloneData.scenes.findIndex(scene => scene === el.scene)].average =
              this.dateUtil.secondsToTimeFull(data.scenes_report[index2].values[
                cloneData.scenes.findIndex(scene => scene === el.scene)].average);
            cloneData.scene_tags_report[index2].values[index].average =
              this.dateUtil.secondsToTimeFull(data.scene_tags_report[index2].values[index].average);
            break;
          default:
            break;
        }
        rowTable[`${cloneData.scenes_report[index2].name}-scene`] =
          cloneData.scenes_report[index2].values[cloneData.scenes.findIndex(scene => scene === el.scene)];
        rowTable[`${cloneData.scenes_report[index2].name}-tag`] = cloneData.scene_tags_report[index2].values[index];
        rowTable[`${cloneData.scenes_report[index2].name}`] =
          cloneData.scenes_report[index2].values[cloneData.scenes.findIndex(scene => scene === el.scene)].count;
      });

      tableData.push(rowTable);
    });
    tableData.map((item, index) => {
      if (index + 1 < tableData.length) {
        tableData[index + 1].indexRow =
          item.scene === tableData[index + 1].scene ? item.indexRow : tableData[index + 1].indexRow;
      }
      return item;
    });
    return tableData;
  }

  isNum(x: any) {
    return !isNaN(x);
  }
}
