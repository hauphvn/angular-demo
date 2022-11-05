import { environment } from '@environments/environment';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
// import { UserModel } from '@app/builds/models/userModel';

import { DateUtil } from '@app/shared/utils/date';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { SceneTagService } from '@app/core/services/component-services/scene-tag.service';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { NAVIGATE } from '@app/configs/app-constants';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterService } from '@app/core/services/component-services/router.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';

@Component({
  selector: 'app-iframe-dashboard',
  templateUrl: './dashboard-iframe.component.html',
  styleUrls: ['./dashboard-iframe.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class IFrameDashboardComponent implements OnInit {
  constructor(
    private router: Router,
    private dateUtil: DateUtil,
    private route: ActivatedRoute,
    private headerService: HeaderService,
    private sceneTagService: SceneTagService,
    private dashboardService: DashboardService,
    private videoChartCommentService: VideoChartCommentService,
    private spinnerService: SpinnerService,
    private dialog: DialogService
  ) {}
  TITLE = environment.webTitle;
  xmlMetaData: any[];
  videoInfo;
  videoID;
  accessToken: string;
  // for left side
  scenes: any[];
  tags: any[];
  listXML: any[];
  tagsFilter: any[];
  scenesFilter: any[];
  videoTitle: string;
  ///

  // for gantt
  taskTypes = { taskName: [], taskNameDisplay: [] };
  tasksFormated: any[];
  numTypeOfXML: any[]; // store length unique array type of XML
  listXMLShowing: any[]; // data is showing
  tagsInScene = {};

  // for comment
  commentItem: any;

  // for videos
  videoList: any[];
  ngOnInit() {
    // Mock
    // this.videoID = 1;

    this.tags = [];
    this.scenes = [];
    this.listXML = [];
    this.tagsFilter = [];
    this.commentItem = {};
    this.scenesFilter = [];
    this.numTypeOfXML = []; // store length unique array type of XML
    this.tasksFormated = [];
    this.listXMLShowing = [];
    // Get in url params
    this.route.queryParams.subscribe(params => {
      this.videoID = params.videoID;
      this.accessToken = params.token;
      const accessToken = this.accessToken;
      this.spinnerService.show();
      this.getAllData().subscribe(([resXML, resVideo]) => {
        if (resVideo instanceof HttpErrorResponse) {
          if (resVideo.status === 400) {
            this.spinnerService.hide();
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
          this.spinnerService.hide();
        }
        this.videoList = resVideo.videos;
        this.videoTitle = resVideo.title;

        // XML data response
        if (resXML instanceof HttpErrorResponse) {
          this.listXML = [];
        } else {
          this.listXML = resXML;
        }
        if (this.listXML.length > 0) {
          this.listXML[0].select = true;
          this.getXMLMetaData(this.listXML[0].id, accessToken);
        } else {
          this.spinnerService.hide();
        }
      });

      this.headerService.videoDetailId.next(this.videoID);
      this.commentItem.videoDetailId = this.videoID;
      this.commentItem.sceneName = '';
      this.commentItem.timeInVideo = 0;
    });
  }

  getXMLData() {
    const accessToken = this.accessToken;
    this.dashboardService.getXMLData(this.videoID, accessToken).subscribe(
      listRes => {
        this.listXML = listRes;
        if (this.listXML.length > 0) {
          this.getXMLMetaData(this.listXML[0].id, accessToken);
          this.videoChartCommentService.xmlName.next(this.listXML[0].name);
        }
      },
      error => {
        // Handle error
      }
    );
  }

  getXMLMetaData(id, accessToken) {
    this.dashboardService.getXMLMetaData(id, accessToken).subscribe(
      xmlRes => {
        const indexInShowing = this.listXMLShowing.findIndex(x => x.id === id);
        if (indexInShowing === -1) {
          this.listXMLShowing.push(xmlRes);
        }
        this.formatTasks(xmlRes);
        this.spinnerService.hide();
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  getVideoData() {
    // Video list
    this.dashboardService.getVideoData(this.videoID, this.accessToken).subscribe(
      data => {
        this.videoList = data.videoList;
        this.videoTitle = data.title;
        // this.videoList.sort((v1, v2) => v1.id - v2.id);
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

  getAllData() {
    const taskGetData = [];
    taskGetData.push(
      this.dashboardService.getXMLData(this.videoID, this.accessToken).pipe(catchError(error => of(error)))
    );
    taskGetData.push(
      this.dashboardService.getVideoData(this.videoID, this.accessToken).pipe(catchError(error => of(error)))
    );
    return forkJoin(...taskGetData);
  }

  addXML(id, accessToken) {
    // Call API to load new XML
    this.spinnerService.show();
    this.dashboardService.getXMLMetaData(id, accessToken).subscribe(
      xml => {
        this.listXMLShowing.push(xml);
        this.formatTasks(xml);
        this.videoChartCommentService.xmlName.next(this.listXMLShowing[0].name);
        this.spinnerService.hide();
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  removeXML(id) {
    const indexXML = this.listXMLShowing.findIndex(x => x.id === id);
    if (indexXML !== -1) {
      // XML is showing
      // Able to remove
      this.spinnerService.show();
      this.listXMLShowing.splice(indexXML, 1);
      this.refreshArrayData();
      // Chart auto update after rebuild
      this.rebuildArrayData();
      this.videoChartCommentService.xmlName.next(this.listXMLShowing[0].name);
      this.spinnerService.hide();
    }
  }

  refreshArrayData() {
    this.tags.length = 0;
    this.scenes.length = 0;
    this.numTypeOfXML.length = 0;
    this.tasksFormated.length = 0;
    this.taskTypes.taskName.length = 0;
    this.taskTypes.taskNameDisplay.length = 0;
  }

  rebuildArrayData() {
    if (this.listXMLShowing.length > 0) {
      this.listXMLShowing.forEach(xml => {
        this.formatTasks(xml);
      });
    }
  }

  formatTasks(xml: any) {
    // Format list to draw rect
    this.tasksFormated = this.tasksFormated.concat(xml.data);
    // Lists to build y label
    const temp = xml.data
      .filter((v, i, s) => {
        return this.onlyUnique(v, i, s, 'taskName');
      })
      .map(t => t.taskName);
    this.taskTypes.taskName = this.taskTypes.taskName.concat(temp);

    const temp1 = xml.data
      .filter((v, i, s) => {
        return this.onlyUnique(v, i, s, 'taskNameDisplay');
      })
      .map(t => t.taskNameDisplay);
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

    const length = temp.length + 1;
    this.numTypeOfXML.push({ name: xml.name, length });

    // Scene/tag unique arrays
    const tempScenes = xml.scenes.filter((v, i, s) => {
      return this.onlyUnique(v, i, s, 'name');
    });
    this.scenes = this.scenes.concat(tempScenes).filter((v, i, s) => {
      return this.onlyUnique(v, i, s, 'name');
    });
    if (xml.tags) {
      const tempTags = xml.tags.filter((v, i, s) => {
        return this.onlyUnique(v, i, s, 'name');
      });
      this.tags = this.tags.concat(tempTags).filter((v, i, s) => {
        return this.onlyUnique(v, i, s, 'name');
      });
    }
  }

  // Remove all item that already exist
  onlyUnique(value, index, self, key) {
    return self.findIndex(i => i[key] === value[key]) === index;
  }

  handleDataClick(event) {
    const accessToken = this.accessToken;
    const { choose, id } = event;
    if (!choose) {
      this.removeXML(id);
    } else {
      this.addXML(id, accessToken);
    }
  }
}
