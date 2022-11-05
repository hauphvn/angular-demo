import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { PopupDashboardSettingComponent } from './components/popup-dashboard-setting/popup-dashboard-setting.component';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';

// import { UserModel } from '@app/builds/models/userModel';
import { DateUtil } from '@app/shared/utils/date';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { SceneTagService } from '@app/core/services/component-services/scene-tag.service';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { messageConstant, NAVIGATE, ROLE_NEW_TYPE, userPrivileges, ZOOM_OPTIONS } from '@app/configs/app-constants';
import { forkJoin, Observable, of, ReplaySubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { GanttChartComponent } from './components/gantt-chart/gantt-chart.component';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';

import { TreeNode } from 'primeng/api';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { CheckUserPermission } from '@app/shared/utils/common';
import { MatDialog, MatSidenav } from '@angular/material';
import { RouterService } from '@app/core/services/component-services/router.service';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { MatSlider } from '@angular/material/slider';
import { ControllBarComponent } from '@app/modules/dashboard/components/controll-bar/controll-bar.component';

interface SceneCountObject {
  [key: string]: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private dateUtil: DateUtil,
    private route: ActivatedRoute,
    private headerService: HeaderService,
    private sceneTagService: SceneTagService,
    private dashboardService: DashboardService,
    private videoChartCommentService: VideoChartCommentService,
    private spinnerService: SpinnerService,
    private toast: ToastrService,
    private dialog: DialogService,
    public dialogMat: MatDialog,
    private sanitization: DomSanitizer,
    private ganttLineService: GanttLineService,
    private videoChartService: VideoChartService,
    private _location: Location,
    private managementService: VideoManagementService,
    private routerService: RouterService,
  ) {
    this.ganttLineService.ganttResize = new ReplaySubject<number>(1);
    this.ganttLineService.ganttTimeRangeChange = new ReplaySubject<number>(1);
    this.ganttLineService.startToMiddleRangeChange = new ReplaySubject<number>(1);
    this.ganttLineService.ganttZoom = new ReplaySubject<number>(1);
  }

  @ViewChildren('applinechart') lineChartComponents: QueryList<LineChartComponent>;
  @ViewChild(GanttChartComponent, { static: false }) ganttComponentInstance: GanttChartComponent;
  @ViewChild('dashboardSettingRef', { static: true }) dashboardSettingInstance: PopupDashboardSettingComponent;
  @ViewChild('drawerRight', { static: false }) drawerRight: MatSidenav;
  @ViewChild('drawerLeft', { static: false }) drawerLeft: MatSidenav;
  @ViewChild('zoomSlider', { static: false }) zoomSlider: MatSlider;
  @ViewChild('controlBarComponent', { static: false }) controlBarComponent: ControllBarComponent;
  xmlMetaData: any[] = [];
  videoInfo;
  videoID;
  // for left side
  scenes: any[] = [];
  tags: any[] = [];
  listXML: any[] = [];
  tagsFilter: any[] = [];
  scenesFilter: any[] = [];
  videoTitle: string;
  listTimeSeriesData: any[] = []; // List to show in leftside
  ///

  // for gantt
  taskTypes = { taskName: [], taskNameDisplay: [] };
  tasksFormated: any[] = [];
  numTypeOfXML: any[] = []; // store length unique array type of XML
  taskTypesOriginal = { taskName: [], taskNameDisplay: [] };
  tasksFormatedOriginal: any[] = [];
  numTypeOfXMLOriginal: any[] = []; // store length unique array type of XML
  listXMLShowing: any[] = []; // data is showing
  listXMLSelectedId: string[] = [];
  tagsInScene = {};
  listTimeSeriesShowing: any[] = []; // timeseries data is showing in chart
  listTimeseriesSelectedId: string[] = [];

  // for comment
  commentItem: any;

  // for videos
  videoList: any[] = [];
  userPrivileges = userPrivileges;

  // Gantt chart sort/filter controls
  scenseFilterSettingOptions = [
    {
      code: 1,
      title: 'Sort as Appear'
    },
    {
      code: 2,
      title: 'Sort as Define on file'
    },
    {
      code: 3,
      title: 'Sort Highest Count'
    },
    {
      code: 4,
      title: 'Sort Lowest Count'
    },
    {
      code: 5,
      title: 'Sort A-Z'
    },
    {
      code: 6,
      title: 'Sort Z-A'
    }
  ];
  currentSceneSetting = { code: 0, title: 'Scene setting' };

  listSceneForSort: {
    name: string;
    scenesOriginal?: string[];
    taskNameAppear?: string[];
    taskNameDisplayAppear?: string[];
    sortedTaskNameCount?: string[];
    sortedTaskNameDisplayCount?: string[];
  }[] = []; // For all sort function

  // for scene filter
  listSceneForFilter: TreeNode[];
  listSceneHaveData: any[] = [];
  listSceneNoneData: any[] = [];
  selectedScene: any;
  xmlResBackup: any;

  // for dashboard setting popup
  isOpen = false;
  isXMLFirst = true;

  ZOOM_OPTIONS = ZOOM_OPTIONS;

  currentZoom = 1;
  showValueZoom = false;
  valueLeftPos = 0;
  currentTimeVideo = 0;
  isRoleAdmin = false;
  isRoleUserPro = false;
  isRoleUserUploader = false;
  isRoleUserStandar = false;
  isRoleUserMinimum = false;
  isRoleUserXMLEdit = false;
  folderName: string;
  videoName: string;

  @HostListener('window:mouseup', ['$event'])
  mouseUp(event) {
    this.handleZoom(event);
  }


  ngOnInit() {
    // Mock
    // this.videoID = 1;

    this.listXML = [];
    this.tagsFilter = [];
    this.commentItem = {};
    this.scenesFilter = [];
    this.listXMLShowing = [];
    this.refreshArrayData();
    // Get in url params
    this.route.queryParams.subscribe(params => {
      this.videoID = params.videoID;
      this.spinnerService.show();
      this.getAllData().subscribe(([resXML, resVideo, resTimeSeries]) => {

        if (resVideo instanceof HttpErrorResponse) {
          if (resVideo.status === 400) {
            this.waitGetMaxvideoDoneThenHideLoading();
            const param = {
              type: 'info',
              title: '',
              message: 'Video data title does not exist on system'
            };
            this.dialog.info(param).subscribe(res => {
              if (res) {
                this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
              }
            });
          }
          this.waitGetMaxvideoDoneThenHideLoading();
        }
        const folderId = resVideo.folder.id;
        localStorage.setItem('currentFoldertId', folderId);
        const folderVideoId = resVideo.folder && resVideo.folder.id;
        this.folderName = resVideo.folder && resVideo.folder.name;
        this.videoName = resVideo['video-set'] && resVideo['video-set'].name;
        this.headerService.userManagementRole.subscribe(data => {
          if (data && data.user_role && data.user_role.length > 0) {
            this.isRoleAdmin = CheckUserPermission.userPermission(
              ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
            );
            if (data.user_policies && data.user_policies.length > 0) {
              data.user_policies.filter(item => {
                const dataCustomUserPolicies: any = CheckUserPermission.getRoleBaseByFolderId(item.project_id, folderId, data.user_policies);
                if (item.folder_id === folderVideoId) {
                  this.headerService.projectIdActice.next(item.project_id);
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
              });
            }
          }
        });
        this.videoList = resVideo.videos;
        if (resXML instanceof HttpErrorResponse) {
          this.listXML = [];
        } else {
          this.listXML = resXML;
        }
        if (this.listXML.length > 0) {
          this.listXML[0].select = true;
          this.getXMLMetaData(this.listXML[0].id);
          this.videoChartCommentService.xmlName.next(this.listXML[0].name);
        } else {
          this.waitGetMaxvideoDoneThenHideLoading();
        }
        if (resTimeSeries instanceof HttpErrorResponse) {
          this.listTimeSeriesData = [];
        } else {
          this.listTimeSeriesData = resTimeSeries;
        }
        if (this.listTimeSeriesData.length > 0) {
          this.listTimeSeriesData[0].select = true;
          this.getTimeSeriesDetailData(this.listTimeSeriesData[0].id);
        }
      });
      this.headerService.videoDetailId.next(this.videoID);
      this.commentItem.videoDetailId = this.videoID;
      this.commentItem.sceneName = '';
      this.commentItem.timeInVideo = 0;
    });
    this.headerService.invokeOpenDashboardSettingDialog.subscribe(value => {
      this.dashboardSettingInstance.togglePopup(true);
    });
  }

  getXMLData() {
    this.dashboardService.getXMLData(this.videoID).subscribe(
      listRes => {
        this.listXML = listRes;
        if (this.listXML.length > 0) {
          this.getXMLMetaData(this.listXML[0].id);
          this.videoChartCommentService.xmlName.next(this.listXML[0].name);
        }
      },
      error => {
        // Handle error
      }
    );
  }

  getXMLMetaData(id) {
    this.spinnerService.show();
    this.dashboardService.getXMLMetaData(id).subscribe(
      xmlRes => {
        const indexInShowing = this.listXMLShowing.findIndex(x => x.id === id);
        if (indexInShowing === -1) {
          this.listXMLShowing.push(xmlRes);
          this.listXMLSelectedId = this.listXMLShowing.map(xml => xml.id.toString());
        }
        this.xmlResBackup = xmlRes;
        this.formatTasks(xmlRes);
        this.getListSceneForFilter();
        this.waitGetMaxvideoDoneThenHideLoading();
      },
      error => {
        this.waitGetMaxvideoDoneThenHideLoading();
      }
    );
  }

  getVideoData() {
    // Video list
    this.dashboardService.getVideoData(this.videoID).subscribe(
      data => {
        this.videoList = data.videos;
        // this.videoTitle = data.title;
        this.videoList.sort((v1, v2) => v1.id - v2.id);
      },
      error => {
        if (error.status && error.status === 400) {
          const param = {
            type: 'info',
            title: '',
            message: 'Video data title does not exist on system'
          };
          this.dialog.info(param).subscribe(res => {
            if (res) {
              this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
            }
          });
        }
      }
    );
  }

  getListTimeSeriesData() {
    this.dashboardService.getListTimeSeriesData(this.videoID).subscribe(
      listRes => {
        this.listTimeSeriesData = listRes;
        if (this.listTimeSeriesData.length > 0) {
          this.getTimeSeriesDetailData(this.listTimeSeriesData[0].id);
        }
      },
      error => {
        // Handle error
      }
    );
  }

  getTimeSeriesDetailData(id: string, addNew = false) {
    this.spinnerService.show();
    this.dashboardService.getSeriesDetailData(id).subscribe(
      res => {
        this.formatBufferTimeseries(res);
        this.listTimeSeriesShowing.push(res);
        this.listTimeseriesSelectedId = this.listTimeSeriesShowing.map(csv => csv.id.toString());
        if (addNew) {
          this.videoChartService.seek(true, this.currentTimeVideo);
          setTimeout(() => {
            this.videoChartService.seekEnd();
          }, 1000);
        }
        this.waitGetMaxvideoDoneThenHideLoading();
      },
      error => {
        this.waitGetMaxvideoDoneThenHideLoading();
      }
    );
  }

  getAllData() {
    const taskGetData = [];
    taskGetData.push(this.dashboardService.getXMLData(this.videoID).pipe(catchError(error => of(error))));
    taskGetData.push(this.dashboardService.getVideoData(this.videoID).pipe(catchError(error => of(error))));
    taskGetData.push(this.dashboardService.getListTimeSeriesData(this.videoID).pipe(catchError(error => of(error))));
    return forkJoin(...taskGetData);
  }

  addXML(id) {
    // Call API to load new XML
    this.spinnerService.show();
    const xmlSelected = this.listXML.find(xml => +xml.id === +id);
    if (xmlSelected) {
      xmlSelected.select = true;
    }
    this.dashboardService.getXMLMetaData(id).subscribe(
      xml => {
        this.refreshArrayData();
        this.rebuildArrayData();
        this.listXMLShowing.push(xml);
        this.listXMLSelectedId = this.listXMLShowing.map(x => x.id.toString());
        this.formatTasks(xml);
        this.getListSceneForFilter();
        this.videoChartCommentService.xmlName.next(this.listXMLShowing[0].name);
        this.handleFilterSettingScene(this.currentSceneSetting);
        this.spinnerService.hide();
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  addTimeSeries(id) {
    // Call API to load new XML
    this.spinnerService.show();
    const csvSelected = this.listTimeSeriesData.find(csv => +csv.id === +id);
    if (csvSelected) {
      csvSelected.select = true;
    }
    this.getTimeSeriesDetailData(id, true);
  }

  removeXML(id) {
    const indexXML = this.listXMLShowing.findIndex(x => x.id === id);
    const xmlRemoved = this.listXML.find(xm => +xm.id === +id);
    if (xmlRemoved) {
      xmlRemoved.select = false;
    }
    if (indexXML !== -1) {
      // XML is showing
      // Able to remove
      this.spinnerService.show();
      this.listXMLShowing.splice(indexXML, 1);
      this.listXMLSelectedId = this.listXMLShowing.map(xml => xml.id.toString());
      this.refreshArrayData();
      // Chart auto update after rebuild
      this.rebuildArrayData();
      this.videoChartCommentService.xmlName.next(this.listXMLShowing[0].name);
      setTimeout(() => {
        this.spinnerService.hide();
      }, 1000);
    }
  }

  removeTimeseries(id) {
    const indexTimeseries = this.listTimeSeriesShowing.findIndex(x => x.id === id);
    const csvRemoved = this.listTimeSeriesData.find(csv => +csv.id === +id);
    if (csvRemoved) {
      csvRemoved.select = false;
    }
    if (indexTimeseries !== -1) {
      // XML is showing
      // Able to remove
      this.spinnerService.show();
      this.listTimeSeriesShowing.splice(indexTimeseries, 1);
      this.listTimeseriesSelectedId = this.listTimeSeriesShowing.map(csv => csv.id.toString());
      setTimeout(() => {
        this.spinnerService.hide();
      }, 1000);
    }
  }

  refreshArrayData() {
    this.tags.length = 0;
    this.scenes.length = 0;
    this.numTypeOfXML.length = 0;
    this.tasksFormated.length = 0;
    this.listSceneForSort.length = 0;
    this.taskTypes.taskName.length = 0;
    this.taskTypes.taskNameDisplay.length = 0;
    this.selectedScene = [];
  }

  rebuildArrayData() {
    if (this.listXMLShowing.length > 0) {
      for (const xml of this.listXMLShowing) {
        this.formatTasks(xml, false);
        this.getListSceneForFilter();
      }
      setTimeout(() => {
        this.handleFilterSettingScene(this.currentSceneSetting);
      }, 1000);
    }
  }

  formatTasks(xml: any, buffer = true) {
    if (buffer) {
      this.formatBufferXML(xml);
    }
    xml.scenes = xml.scenes && xml.scenes.length > 0 ? xml.scenes : [];
    // Format list to draw rect
    this.tasksFormated = this.tasksFormated.concat(xml.data);
    // Sort xml for start date
    xml.data.sort((a, b) => a.startDate - b.startDate);
    // Lists to build y label
    const temp = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskName')).map(t => t.taskName);
    this.taskTypes.taskName = this.taskTypes.taskName.concat(temp);

    const temp1 = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskNameDisplay')).map(t => t.taskNameDisplay);
    this.taskTypes.taskNameDisplay = this.taskTypes.taskNameDisplay.concat(temp1);

    const taskNameNoData = xml.scenes.filter(scene => !temp1.some(taskName => taskName === scene.name));
    taskNameNoData.forEach(task => {
      this.taskTypes.taskName.push(`_${xml.id}-${task.name}`);
      temp.push(`_${xml.id}-${task.name}`);
      this.taskTypes.taskNameDisplay.push(task.name);
      temp1.push(task.name);
    });
    this.taskTypes.taskName.push(`xml${xml.id}footer`);
    this.taskTypes.taskNameDisplay.push('');

    this.listSceneForSort.push({
      name: xml.name,
      scenesOriginal: xml.scenes.map(scene => scene.name),
      taskNameAppear: [...temp, `xml${xml.id}footer`],
      taskNameDisplayAppear: [...temp1, ''],
      ...this.countingScense(xml.data, xml.id, taskNameNoData)
    });

    const length = xml.scenes.length + 1;
    this.numTypeOfXML.push({ name: xml.name, length });

    // Scene/tag unique arrays
    const tempScenes = xml.scenes.filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    this.scenes = this.scenes.concat(tempScenes).filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    if (xml.tags) {
      const tempTags = xml.tags.filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
      this.tags = this.tags.concat(tempTags).filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    }
    this.taskTypesOriginal = JSON.parse(JSON.stringify(this.taskTypes));
    this.numTypeOfXMLOriginal = JSON.parse(JSON.stringify(this.numTypeOfXML));
    this.tasksFormatedOriginal = JSON.parse(JSON.stringify(this.tasksFormated));
  }

  formatBufferXML(xml: any) {
    if (xml.bufferTime) {
      for (const data of xml.data) {
        data.startDate = Math.max(0, +data.startDate - xml.bufferTime);
        data.endDate = Math.max(0, +data.endDate - xml.bufferTime);
      }
    }
  }

  formatBufferTimeseries(timeseries: any) {
    const { data: lines, bufferTime } = timeseries;

    if (bufferTime) {
      const indexOfVirtualPoint = lines[0].data.findIndex(item => item.time >= bufferTime);

      if (indexOfVirtualPoint > 0) {
        for (const line of lines) {
          var skipRecalculate = line.data[indexOfVirtualPoint].time == bufferTime;

          const x0 = parseFloat(line.data[indexOfVirtualPoint - 1].time);
          const x1 = parseFloat(line.data[indexOfVirtualPoint].time);
          const y0 = parseFloat(line.data[indexOfVirtualPoint - 1].value);
          const y1 = parseFloat(line.data[indexOfVirtualPoint].value);
          const percent0 = parseFloat(line.data[indexOfVirtualPoint - 1].percent);
          const percent1 = parseFloat(line.data[indexOfVirtualPoint].percent);
          const virtualValue: any = skipRecalculate ? y1 : (y0 + ((bufferTime - x0) * (y1 - y0)) / (x1 - x0)).toFixed(2);
          const virtualPercent = skipRecalculate ? percent1 : (percent0 + ((bufferTime - x0) * (percent1 - percent0)) / (x1 - x0)).toFixed(2);;
          const virtualPoint = { time: bufferTime, value: virtualValue, percent: virtualPercent };
          line.data.splice(0, indexOfVirtualPoint, virtualPoint);
          line.data = line.data.map(d => {
            d.time = Math.fround(d.time * 1000 - bufferTime * 1000) / 1000;
            return d;
          });
        }
      }
    }
  }

  // Remove all item that already exist
  onlyUnique(value, index, self, key) {
    return self.findIndex(i => i[key] === value[key]) === index;
  }

  handleDataClick(event) {
    const { choose, id } = event;
    if (!choose) {
      this.removeXML(id);
    } else {
      this.addXML(id);
    }
  }

  handleTimeSeriesClick(event) {
    const { choose, id } = event;
    if (!choose) {
      this.removeTimeseries(id);
    } else {
      this.addTimeSeries(id);
    }
  }

  handleFilterSettingScene(option: { code: number; title: string }) {
    this.currentSceneSetting = option;
    this.spinnerService.show();
    switch (option.code) {
      case 1:
        this.handleSortAppear();
        break;
      case 2:
        this.taskTypes.taskName = this.handleSortTaskNameBySceneOriginal(this.taskTypes.taskName);
        this.taskTypes.taskNameDisplay = this.handleSortTaskNameDisplayBySceneOriginal(this.taskTypes.taskNameDisplay);
        break;
      case 3:
        this.handleSortHighestLowest(false);
        break;
      case 4:
        this.handleSortHighestLowest();
        break;
      case 5:
        this.handleSortSceneOfAllXML();
        break;
      case 6:
        this.handleSortSceneOfAllXML((a, b) => (a > b ? -1 : a < b ? 1 : 0));
        break;
      default:
        break;
    }
    this.ganttComponentInstance.buildGantt();
    setTimeout(() => {
      this.spinnerService.hide();
    }, 1000);
  }

  // For sort case 5-6
  handleSortSceneOfAllXML(sortFunction?: (a: string, b: string) => number) {
    let startIndex = 0;
    const sortedTaskName = [];
    const sortedTaskNameDisplay = [];
    for (const { length } of this.numTypeOfXML) {
      const taskNamePart = this.taskTypes.taskName.slice(startIndex, startIndex + length); // Get sub array
      const taskNameDisplayPart = this.taskTypes.taskNameDisplay.slice(startIndex, startIndex + length); // Get sub array

      const taskNameFooter = taskNamePart.splice(-1, 1); // cut and keep the last taskName element
      const taksNameDisplayFooter = taskNameDisplayPart.splice(-1, 1); // cut and keep the last taskNameDisplay element
      sortedTaskName.push(...[...taskNamePart.sort(sortFunction), ...taskNameFooter]);
      sortedTaskNameDisplay.push(...[...taskNameDisplayPart.sort(sortFunction), ...taksNameDisplayFooter]);

      startIndex += length;
    }

    this.taskTypes.taskName = sortedTaskName;
    this.taskTypes.taskNameDisplay = sortedTaskNameDisplay;
  }

  // For sort case 2
  handleSortTaskNameBySceneOriginal(taskNameArray: string[]) {
    let startIndex = 0;
    const sortedArray = [];
    for (const [index, { length, name }] of this.numTypeOfXML.entries()) {
      const taskNamePart = taskNameArray.slice(startIndex, startIndex + length); // Get sub array
      const taskNameFooter = taskNamePart.splice(-1, 1)[0]; // cut and keep the last taskName element
      for (const item of this.listSceneForSort.find(el => el.name === name).scenesOriginal) {
        const itemInTaskNameArray = taskNamePart.find(taskName => taskName.replace(/_\d+-/g, '') === item);
        if (itemInTaskNameArray) {
          sortedArray.push(itemInTaskNameArray);
        }
      }
      sortedArray.push(taskNameFooter);
      startIndex += length;
    }
    return sortedArray;
  }

  // For sort case 2
  handleSortTaskNameDisplayBySceneOriginal(taskNameDisplayArray: string[]) {
    let startIndex = 0;
    const sortedArray = [];
    for (const [index, { length, name }] of this.numTypeOfXML.entries()) {
      const taskNameDisplayPart = taskNameDisplayArray.slice(startIndex, startIndex + length); // Get sub array
      const taskNameDisplayFooter = taskNameDisplayPart.splice(-1, 1)[0]; // cut and keep the last taskName element

      for (const item of this.listSceneForSort.find(el => el.name === name).scenesOriginal) {
        const itemInTaskNameArray = taskNameDisplayPart.find(
          taskNameDisplay => taskNameDisplay.replace(/_\d+-/g, '') === item
        );
        if (itemInTaskNameArray) {
          sortedArray.push(itemInTaskNameArray);
        }
      }
      sortedArray.push(taskNameDisplayFooter);
      startIndex += length;
    }
    return sortedArray;
  }

  // For sort case 1
  handleSortAppear() {
    const sortedTaskName = [];
    const sortedTaskNameDisplay = [];
    for (const { taskNameAppear, taskNameDisplayAppear } of this.listSceneForSort) {
      sortedTaskName.push(...(taskNameAppear || []));
      sortedTaskNameDisplay.push(...(taskNameDisplayAppear || []));
    }
    this.taskTypes.taskName = sortedTaskName.filter(el => this.taskTypes.taskName.some(e => e === el));
    const tempSort = [];
    sortedTaskNameDisplay.forEach((el) => {
      if (this.taskTypes.taskNameDisplay.some(item => item === el)) {
        tempSort.push(this.taskTypes.taskNameDisplay.find(item => item === el));
      }
    });
    this.taskTypes.taskNameDisplay = tempSort;
  }

  // For sort case 3-4
  countingScense(data: any, id: string, noData: any) {
    const sceneTaskNameCount: SceneCountObject = {};
    const sceneTaskNameDisplayCount: SceneCountObject = {};

    for (const { taskName, taskNameDisplay } of data) {
      if (sceneTaskNameCount[taskName]) {
        sceneTaskNameCount[taskName] += 1;
        sceneTaskNameDisplayCount[taskNameDisplay] += 1;
      } else {
        sceneTaskNameCount[taskName] = 1;
        sceneTaskNameDisplayCount[taskNameDisplay] = 1;
      }
    }
    // Add scene no data
    noData.forEach(task => {
      sceneTaskNameCount[`_${id}-${task.name}`] = 0;
      sceneTaskNameDisplayCount[task.name] = 0;
    });

    const sortedTaskNameCount = Object.entries(sceneTaskNameCount)
      .sort((a, b) => a[1] - b[1])
      .map(task => task[0]);
    const sortedTaskNameDisplayCount = Object.entries(sceneTaskNameDisplayCount)
      .sort((a, b) => a[1] - b[1])
      .map(task => task[0]);

    sortedTaskNameCount.push(`xml${id}footer`);
    sortedTaskNameDisplayCount.push('');
    return { sortedTaskNameCount, sortedTaskNameDisplayCount };
  }

  handleSortHighestLowest(isSortLowest = true) {
    const sortedTaskName = [];
    const sortedTaskNameDisplay = [];
    for (const { sortedTaskNameCount, sortedTaskNameDisplayCount } of this.listSceneForSort) {
      if (isSortLowest) {
        // 1 -> n
        sortedTaskName.push(...(sortedTaskNameCount || []));
        sortedTaskNameDisplay.push(...(sortedTaskNameDisplayCount || []));
      } else {
        // n -> 1
        const taskNameFooter = [...sortedTaskNameCount].splice(-1, 1)[0];
        const taskNameDisplayFooter = [...sortedTaskNameDisplayCount].splice(-1, 1)[0];
        // Reverse from 0 -> length - 2 (not include last item)
        // And then re-apply footer to sorted array
        const taskNameSortedTemp = [...sortedTaskNameCount.slice(0, -1).reverse(), taskNameFooter];
        const taskNameDisplaySortedTemp = [...sortedTaskNameDisplayCount.slice(0, -1).reverse(), taskNameDisplayFooter];
        sortedTaskName.push(...(taskNameSortedTemp || []));
        sortedTaskNameDisplay.push(...(taskNameDisplaySortedTemp || []));
      }
    }

    this.taskTypes.taskName = sortedTaskName.filter(el => this.taskTypes.taskName.some(e => e === el));
    const tempSort = [];
    sortedTaskNameDisplay.forEach((el) => {
      if (this.taskTypes.taskNameDisplay.some(item => item === el)) {
        tempSort.push(this.taskTypes.taskNameDisplay.find(item => item === el));
      }
    });
    this.taskTypes.taskNameDisplay = tempSort;
  }

  countingAllScense() {
    return new Promise(resolve => {
      const sceneTaskNameDisplayCount: SceneCountObject = {};
      for (const { taskNameDisplay } of this.tasksFormated) {
        if (sceneTaskNameDisplayCount[taskNameDisplay]) {
          sceneTaskNameDisplayCount[taskNameDisplay] += 1;
        } else {
          sceneTaskNameDisplayCount[taskNameDisplay] = 1;
        }
      }
      return resolve(sceneTaskNameDisplayCount);
    });
  }

  async getListSceneForFilter() {
    const dataXML = Object.entries(await this.countingAllScense()).sort((a, b) => a[1] - b[1]);
    let listSceneNoneData = [];
    const listSceneHaveData = [];
    for (const [key, value] of dataXML) {
      listSceneNoneData.unshift({ sceneName: key });
      listSceneHaveData.unshift({ label: `${key} (${value})`, sceneName: key });
    }
    listSceneNoneData = this.scenes.filter(({ name: e1 }) => !listSceneNoneData.some(({ sceneName: e2 }) => e1 === e2));
    listSceneNoneData = listSceneNoneData.map(scene => {
      return {
        label: `${scene.name} (0)`,
        sceneName: scene.name
      };
    });
    if (listSceneNoneData.length > 0) {
      this.listSceneForFilter = [
        {
          label: `All have data (${listSceneHaveData.length})`,
          children: listSceneHaveData
        },
        {
          label: `All none data (${listSceneNoneData.length})`,
          children: listSceneNoneData
        }
      ];
    } else {
      this.listSceneForFilter = [
        {
          label: `All have data (${listSceneHaveData.length})`,
          children: listSceneHaveData
        }
      ];
    }
    const temp = this.listSceneForFilter.concat(listSceneHaveData, listSceneNoneData);
    this.selectedScene = temp;
  }

  handleFilterScene() {
    if (this.selectedScene && this.selectedScene.length > 0) {
      this.spinnerService.show();
      const taskNameFilterList = this.getTaskNameFilterList();
      this.tasksFormated = [];
      this.numTypeOfXML = [];
      this.taskTypes = { taskName: [], taskNameDisplay: [] };
      taskNameFilterList.forEach(taskName => {
        this.tasksFormated.push(...this.tasksFormatedOriginal.filter(item => item.taskNameDisplay === taskName));
      });

      const convertTask = this.convertTaskType(this.taskTypesOriginal);
      const arrCut = [];
      this.numTypeOfXMLOriginal.forEach(el => {
        arrCut.push(convertTask.splice(0, el.length));
      });
      const arrFilter = [];
      arrCut.forEach((element, index) => {
        const arr = [];
        taskNameFilterList.forEach(taskName => {
          arr.push(...element.filter(el => el.taskNameDisplay === taskName));
        });
        if (arr.length > 0) {
          arrFilter.push(...arr);
          arrFilter.push(element[element.length - 1]);
          this.numTypeOfXML.push({
            name: this.numTypeOfXMLOriginal[index].name,
            length: arr.length + 1
          });
        }
      });
      arrFilter.forEach(element => {
        this.taskTypes.taskName.push(element.taskName);
        this.taskTypes.taskNameDisplay.push(element.taskNameDisplay);
      });
      this.handleFilterSettingScene(this.currentSceneSetting);
    } else {
      this.tasksFormated = JSON.parse(JSON.stringify(this.tasksFormatedOriginal));
      this.numTypeOfXML = JSON.parse(JSON.stringify(this.numTypeOfXMLOriginal));
      this.taskTypes = JSON.parse(JSON.stringify(this.taskTypesOriginal));
    }
  }

  convertTaskType(data) {
    const tasks = [];
    data.taskName.forEach((element, index) => {
      const object = {
        taskName: element,
        taskNameDisplay: data.taskNameDisplay[index]
      };
      tasks.push(object);
    });
    return tasks;
  }

  handleSettingChange(setting: { isXMLFirst: boolean; listXMLSorted: string[]; listTimeseriesSorted: string[] }) {
    const prevCurrentVideoTime = this.currentTimeVideo;
    this.spinnerService.show();
    this.isXMLFirst = setting.isXMLFirst;
    let forkJoinAll: Observable<any>[] = [];
    const xmlForkJoin: Observable<any>[] = [];
    const timeseriesForkJoin: Observable<any>[] = [];

    for (const xmlId of setting.listXMLSorted) {
      const dataExist = this.listXMLShowing.find(xml => +xml.id === +xmlId);
      if (dataExist) {
        xmlForkJoin.push(of(dataExist));
      } else {
        xmlForkJoin.push(this.dashboardService.getXMLMetaData(xmlId));
      }
    }

    for (const csvId of setting.listTimeseriesSorted) {
      const dataExist = this.listTimeSeriesShowing.find(csv => +csv.id === +csvId);
      if (dataExist) {
        timeseriesForkJoin.push(of(dataExist));
      } else {
        timeseriesForkJoin.push(this.dashboardService.getSeriesDetailData(csvId));
      }
    }

    forkJoinAll = [forkJoin(xmlForkJoin), forkJoin(timeseriesForkJoin)];
    forkJoin(forkJoinAll).subscribe(
      ([newXMLShowingList, newTimeseriesShowingList]) => {
        this.listXMLShowing = newXMLShowingList;
        this.listTimeSeriesShowing = newTimeseriesShowingList; // line chart updates automatically

        this.listXMLSelectedId = setting.listXMLSorted;
        this.listTimeseriesSelectedId = setting.listTimeseriesSorted;

        // For rebuild gantt chart
        this.refreshArrayData();
        // Chart auto update after rebuild
        this.rebuildArrayData();
        this.videoChartCommentService.xmlName.next(this.listXMLShowing[0].name);
        setTimeout(() => this.spinnerService.hide(), 1000);
      },
      error => {
        this.toast.error(messageConstant.FAIL_TO_GET);
        this.spinnerService.hide();
      }
    );

    this.listXML = this.listXML.map(xml => {
      return { ...xml, ...{ select: setting.listXMLSorted.findIndex(id => +id === +xml.id) !== -1 } };
    });
    this.listTimeSeriesData = this.listTimeSeriesData.map(csv => {
      return { ...csv, ...{ select: setting.listTimeseriesSorted.findIndex(id => +id === +csv.id) !== -1 } };
    });
    setTimeout(() => {
      this.controlBarComponent.sliderMoveFormat(prevCurrentVideoTime);
      this.ganttComponentInstance.handleZoom(this.currentZoom);
    }, 1000);
  }

  getTaskNameFilterList(): Array<any> {
    const result = [];
    const sceneNodeList = Object(this.selectedScene);
    if (sceneNodeList.length > 0) {
      const taskNameList = sceneNodeList.filter(sceneNode => {
        return !sceneNode.hasOwnProperty('children');
      });
      for (const task of taskNameList) {
        result.push(task.sceneName);
      }
    }
    return result;
  }

  trackByFunction(index: number, item: any) {
    return item.id;
  }

  handleZoomClick(direction: number) {
    const { MIN_ZOOM, MAX_ZOOM, STEP_ZOOM } = ZOOM_OPTIONS;
    const kZoomTemp = (this.currentZoom * 10 * 10 + direction * STEP_ZOOM * 100) / 100;
    if (kZoomTemp <= MAX_ZOOM && kZoomTemp >= MIN_ZOOM) {
      this.currentZoom = kZoomTemp;
      this.ganttComponentInstance.handleZoom(this.currentZoom);
    }
  }

  handleZoom(event: MouseEvent) {
    this.showValueZoom = false;
    this.ganttComponentInstance.handleZoom(this.currentZoom);
    // this.$emit(this.EVENT_LIST.zoomChange, this.inputValue);
  }

  handleUpdateValueLeftPos(event: MouseEvent) {
    this.valueLeftPos = event.offsetX - 25;
    this.valueLeftPos = Math.max(-16, Math.min(216, this.valueLeftPos));
  }

  getLeftPos() {
    return this.sanitization.bypassSecurityTrustStyle(`${this.valueLeftPos}px`);
  }

  currentTime(event) {
    this.currentTimeVideo = event;
  }

  onGoBack() {
    this.routerService.setIsBackFromDashboard(true);
    this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
  }

  handleEditingXMLClick(): void {
    this.spinnerService.show();
    this.managementService.getVideoDetailById(this.videoID).subscribe(
      result => {
        if (
          // result &&
          // result.privileges &&
          // result.privileges.length > 0 &&
          // this.userPrivileges[result.privileges[0]] >= this.userPrivileges.VIEWER
          result && (this.isRoleAdmin || this.isRoleUserXMLEdit)
        ) {
          this.spinnerService.hide();
          this.router.navigate([`/${NAVIGATE.DASHBOARD}/edit/XML`], { queryParams: { videoID: this.videoID } });
        } else {
          this.spinnerService.hide();
          const param = {
            type: 'info',
            title: 'INFORM',
            message: 'You do not have permission'
          };
          this.dialog.info(param).subscribe(response => {
            if (response) {
              location.reload();
            }
          });
        }
      },
      err => {
        this.spinnerService.hide();
        const param = {
          type: 'info',
          title: 'INFORM',
          message: 'Video data title does not exist on system'
        };
        this.dialog.info(param).subscribe(res => {
          if (res) {
            location.reload();
          }
        });
      }
    );
  }

  handleDashboardSettingClick(): void {
    this.addBlurStyleById('dashboard-section');
    this.addBlurStyleById('wrap-main-header');
    this.headerService.onOpenDashboardSettingClick();
  }

  handleCutVideoClick() {
    if (!!this.videoID) {
      this.router.navigate([`/${NAVIGATE.DASHBOARD}/${this.videoID}`]);
    }
  }

  ngOnDestroy() {
    this.ganttLineService.ganttResize.unsubscribe();
    this.ganttLineService.ganttTimeRangeChange.unsubscribe();
    this.ganttLineService.startToMiddleRangeChange.unsubscribe();
    this.ganttLineService.ganttZoom.unsubscribe();
  }

  private addBlurStyleById(id: string) {
    document.getElementById(id).style.cssText =
      `pointer-events: none;
       -webkit-filter: blur(15px);
       -moz-filter: blur(15px);
       -ms-filter: blur(15px);
       -o-filter: blur(15px);
       filter: blur(15px);`;
  }

  close(closed: boolean, from: string) {
    var time = 500 * (this.listTimeSeriesShowing && this.listTimeSeriesShowing.length > 0 ? this.listTimeSeriesShowing.length : 1.5);
    this.spinnerService.show();
    if (closed && from && from == 'right') {
      this.drawerRight.close();
    }
    if (!closed && from == 'right') {
      this.drawerRight.open();
    }
    if (closed && from && from == 'left') {
      this.drawerLeft.close();
    }
    if (!closed && from == 'left') {
      this.drawerLeft.open();
    }

    setTimeout(() => {
      this.lineChartComponents.forEach(lineChartComponent => {
        if (lineChartComponent && lineChartComponent.lineChartArea) {
          const { offsetWidth } = lineChartComponent.lineChartArea.nativeElement;
          if (lineChartComponent.clientWidthChart !== offsetWidth) {
            if (lineChartComponent.clientWidthChart > 0) {
              lineChartComponent.lineService.updateChart(false, true, offsetWidth);
            }
            lineChartComponent.clientWidthChart = offsetWidth;
          }
        }
      });
      this.ganttComponentInstance.buildGantt();
    }, time);




    setTimeout(() => {
      this.spinnerService.hide();
    }, time + 500);

  }

  waitGetMaxvideoDoneThenHideLoading() {
    setTimeout(() => {
      this.spinnerService.hide();
    }, 2000);
  }
}

