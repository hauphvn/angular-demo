import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Component, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { ReportService } from '@app/core/services/server-services/report.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { Router } from '@angular/router';
import { NAVIGATE, ZOOM_OPTIONS } from '@app/configs/app-constants';
import { GanttChartComponent } from '@app/modules/dashboard/components/gantt-chart/gantt-chart.component';
import { SceneTagService } from '@app/core/services/component-services/scene-tag.service';
import { ReportingPreviewModel } from '@app/shared/models/reportModel';

@Component({
  selector: 'app-reporting-preview',
  templateUrl: './reporting-preview.component.html',
  styleUrls: ['./reporting-preview.component.scss']
})
export class ReportingPreviewComponent implements OnInit {
  isClickedRemoveScene = false;
  constructor(
    public dialogRef: MatDialogRef<ReportingPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private reportService: ReportService,
    private spinnerService: SpinnerService,
    private dialog: DialogService,
    private sceneTagService: SceneTagService
  ) { }

  @ViewChild(GanttChartComponent, { static: false }) ganttComponentInstance: GanttChartComponent;

  listXML: any[] = [];

  selectedTags: any[];
  selectedScenes: any[];

  videoSetList: any[];
  indexSelect = 0;
  reportPreviews: ReportingPreviewModel[] = [];
  videoSetsIdFilteredBySceneName: number[] = [];
  videoDetailList: any[];

  taskTypes = { taskName: [], taskNameDisplay: [] };
  tasksFormated: any[] = [];
  numTypeOfXML: any[] = []; // store length unique array type of XML
  listXMLShowing: any[] = []; // data is showing

  taskTypesOriginal = { taskName: [], taskNameDisplay: [] };
  tasksFormatedOriginal: any[] = [];
  numTypeOfXMLOriginal: any[] = []; // store length unique array type of XML

  listTimeSeriesData: any[] = []; // List to show in leftside
  listTimeSeriesShowing: any[] = []; // timeseries data is showing in chart
  imageNoVideo = '../../../../assets/images/noVideo.png';
  addedFooter = false;
  sceneListOld = [];

  from = 'reporting';
  ZOOM_OPTIONS = ZOOM_OPTIONS;
  currentZoom = 1;
  showValueZoom = false;
  valueLeftPos = 0;

  @HostListener('window:mouseup', ['$event'])
  mouseUp(event) {
    this.handleZoom(event);
  }

  ngOnInit() {
    this.data.tags = this.data.tags.map(tag => {
      return { name: tag };
    });

    this.data.scenes = this.data.scenes.map(scene => {
      return { name: scene };
    });
    this.selectedScenes = [{ name: this.data.sceneSelected }];
    this.refreshArrayData();
    this.spinnerService.show();
    const videoIds = this.data.videoSets.map(video => video.id);
    this.reportPreviews = this.data.previewModels;
    this.reportService.getListVideoSetReport(videoIds).subscribe(
      res => {
        this.videoSetList = res.video_details;
        this.getAllData(this.videoSetList[this.indexSelect].id).subscribe(([resXML, resVideo, resTimeSeries]) => {
          if (resVideo instanceof HttpErrorResponse) {
            if (resVideo.status === 400) {
              this.spinnerService.hide();
              const param = {
                type: 'info',
                title: '',
                message: 'Video data title does not exist on system'
              };
              this.dialog.info(param).subscribe(userRes => {
                if (userRes) {
                  this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
                }
              });
            }
            // this.spinnerService.hide();
          }
          this.videoDetailList = resVideo.videos;
          this.listXML = resXML;
          if (this.listXML.length > 0) {
            this.listXML[0].select = true;
            this.listXML.forEach(xml => {
              this.getXMLMetaData(xml.id);
            });
            // this.videoChartCommentService.xmlName.next(this.listXML[0].name);
          } else {
            // this.spinnerService.hide();
          }

          this.listTimeSeriesData = resTimeSeries;
          if (this.listTimeSeriesData.length > 0) {
            this.listTimeSeriesData[0].select = true;
            this.getTimeSeriesDetailData(this.listTimeSeriesData[0].id);
          }

          this.videoSetList.forEach((video) => {
            if (!video.thumbnail) {
              video.thumbnail = this.imageNoVideo;
            }
          });
        });
        // this.spinnerService.hide();
      },
      () => this.spinnerService.hide()
    );
  }

  refreshArrayData() {
    // this.tags.length = 0;
    // this.scenes.length = 0;
    // this.selectedScene = [];
    // this.listSceneForSort.length = 0;
    this.numTypeOfXML.length = 0;
    this.tasksFormated.length = 0;
    this.taskTypes.taskName.length = 0;
    this.taskTypes.taskNameDisplay.length = 0;
  }

  rebuildArrayData() {
    if (this.listXMLShowing.length > 0) {
      for (const xml of this.listXMLShowing) {
        this.formatTasks(xml);
        // this.getListSceneForFilter();
      }
      // setTimeout(() => {
      //   this.handleFilterSettingScene(this.currentSceneSetting);
      // });
    }
  }

  formatTasks(xml: any) {
    this.formatBufferXML(xml);
    // Format list to draw rect
    this.tasksFormated = this.tasksFormated.concat(xml.data);
    // Lists to build y label
    const temp = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskName')).map(t => t.taskName);
    this.taskTypes.taskName = this.taskTypes.taskName.concat(temp);
    this.taskTypes.taskName.push(`xml${xml.id}footer`);
    const temp1 = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskNameDisplay')).map(t => t.taskNameDisplay);
    this.taskTypes.taskNameDisplay = this.taskTypes.taskNameDisplay.concat(temp1);
    this.taskTypes.taskNameDisplay.push('');

    // this.listSceneForSort.push({
    //   name: xml.name,
    //   scenesOriginal: xml.scenes.map(scene => scene.name),
    //   taskNameAppear: [...temp, `xml${xml.id}footer`],
    //   taskNameDisplayAppear: [...temp1, ''],
    //   ...this.countingScense(xml.data, xml.id)
    // });

    const length = temp.length + 1;
    this.numTypeOfXML.push({ name: xml.name, length });

    // Scene/tag unique arrays
    // const tempScenes = xml.scenes.filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    // this.scenes = this.scenes.concat(tempScenes).filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    // if (xml.tags) {
    //   const tempTags = xml.tags.filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    //   this.tags = this.tags.concat(tempTags).filter((v, i, s) => this.onlyUnique(v, i, s, 'name'));
    // }
    this.taskTypesOriginal = JSON.parse(JSON.stringify(this.taskTypes));
    this.numTypeOfXMLOriginal = JSON.parse(JSON.stringify(this.numTypeOfXML));
    this.tasksFormatedOriginal = JSON.parse(JSON.stringify(this.tasksFormated));
    this.handleFilterScene(true);
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
          const x0 = Number(line.data[indexOfVirtualPoint - 1].time);
          const x1 = Number(line.data[indexOfVirtualPoint].time);
          const y0 = Number(line.data[indexOfVirtualPoint - 1].value);
          const y1 = Number(line.data[indexOfVirtualPoint].value);
          const percent0 = Number(line.data[indexOfVirtualPoint - 1].percent);
          const percent1 = Number(line.data[indexOfVirtualPoint].percent);
          const virtualValue = (+(y0 + ((bufferTime - x0) * (y1 - y0)) / (x1 - x0))).toFixed(2);
          const virtualPercent =
            y1 - y0 === 0
              ? 100
              : Math.min(percent1, percent0) + ((percent1 - percent0) * (+virtualValue - Math.min(y0, y1))) / (y1 - y0);
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

  getXMLMetaData(id) {
    this.spinnerService.show();
    this.reportService.getXMLMetaData(id).subscribe(
      xmlRes => {
        const indexInShowing = this.listXMLShowing.findIndex(x => x.id === id);
        if (indexInShowing === -1) {
          this.listXMLShowing = [xmlRes];
          // this.listXMLShowing.push(xmlRes);
          // this.listXMLSelectedId = this.listXMLShowing.map(xml => xml.id.toString());
        }
        // this.xmlResBackup = xmlRes;
        this.formatTasks(xmlRes);
        // this.getListSceneForFilter();
        this.spinnerService.hide();
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  getTimeSeriesDetailData(id: string) {
    this.spinnerService.show();
    this.reportService.getSeriesDetailData(id).subscribe(
      res => {
        this.formatBufferTimeseries(res);
        this.listTimeSeriesShowing = [res];
        this.spinnerService.hide();
        // this.listTimeSeriesShowing.push(res);
        // this.listTimeseriesSelectedId = this.listTimeSeriesShowing.map(csv => csv.id.toString());
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  // Remove all item that already exist
  onlyUnique(value, index, self, key) {
    return self.findIndex(i => i[key] === value[key]) === index;
  }

  getAllData(videoId: string) {
    const taskGetData = [];
    taskGetData.push(this.reportService.getXMLData(videoId).pipe(catchError(error => of(error))));
    taskGetData.push(this.reportService.getVideoData(videoId).pipe(catchError(error => of(error))));
    taskGetData.push(this.reportService.getListTimeSeriesData(videoId).pipe(catchError(error => of(error))));
    return forkJoin(...taskGetData);
  }

  handleChangeVideoSet(index: number) {
    this.indexSelect = index;
    this.refreshArrayData();
    this.spinnerService.show();
    this.getAllData(this.videoSetList[this.indexSelect].id).subscribe(([resXML, resVideo, resTimeSeries]) => {
      if (resVideo instanceof HttpErrorResponse) {
        if (resVideo.status === 400) {
          this.spinnerService.hide();
          const param = {
            type: 'info',
            title: '',
            message: 'Video data title does not exist on system'
          };
          this.dialog.info(param).subscribe(userRes => {
            if (userRes) {
              this.spinnerService.hide();
              this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
            }
          });
        }
      }
      this.videoDetailList = resVideo.videos;
      this.listXML = resXML;
      if (this.listXML.length > 0) {
        this.listXML[0].select = true;
        this.listXML.forEach((xml) => {
          this.getXMLMetaData(xml.id);
        });
      }
      this.listTimeSeriesData = resTimeSeries;
      if (this.listTimeSeriesData.length > 0) {
        this.listTimeSeriesData[0].select = true;
        this.getTimeSeriesDetailData(this.listTimeSeriesData[0].id);
      }
      
      this.videoSetList.forEach((video) => {
        if (!video.thumbnail) {
          video.thumbnail = this.imageNoVideo;
        }
      });
    });
  }

  handleFilterScene(isInit = false) {
    const isSceneListChange = JSON.stringify(this.sceneListOld) != JSON.stringify(this.selectedScenes);
    this.sceneListOld = JSON.parse(JSON.stringify(this.selectedScenes));
    this.sceneTagService.clearScene(this.from);
    if (this.selectedScenes && this.selectedScenes.length > 0) {
      this.videoSetsIdFilteredBySceneName = [];
      const sceneToFilter = this.selectedScenes.map(scene => scene.name);
      this.spinnerService.show();
      this.tasksFormated = [];
      this.numTypeOfXML = [];
      this.taskTypes = { taskName: [], taskNameDisplay: [] };
      sceneToFilter.forEach(taskName => {
        this.getVideoSetIdBySceneName(taskName);
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
        sceneToFilter.forEach(taskName => {
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

      setTimeout(() => {
        if (this.taskTypes.taskName.length > 0) {
          this.ganttComponentInstance.buildGantt();
        }
        const listSceneFilterInGantt = arrFilter.map(sceneObj => sceneObj.taskNameDisplay);
        listSceneFilterInGantt.splice(-1, 1);
        this.sceneTagService.sceneList = listSceneFilterInGantt;
        this.sceneTagService.scenes.next({ from: this.from, newList: listSceneFilterInGantt });
        this.spinnerService.hide();
      }, 1000);
    } else {
      this.tasksFormated = JSON.parse(JSON.stringify(this.tasksFormatedOriginal));
      this.numTypeOfXML = JSON.parse(JSON.stringify(this.numTypeOfXMLOriginal));
      // this.taskTypes = JSON.parse(JSON.stringify(this.taskTypesOriginal));
      this.listTimeSeriesData = [];
      this.taskTypes = { taskName: [], taskNameDisplay: [] };
    }
    if (!isInit && isSceneListChange) {
      this.reLoadVideoSets();
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

  closeModal() {
    this.dialogRef.close(false);
  }

  handleSaveClick() {
    //
    this.dialogRef.close(true);
  }

  trackByFunction(index: number, item: any) {
    return item.id;
  }

  handleNextVideoSet() {
    // const newIndex = this.indexSelect + 1;
    // if (newIndex < this.videoSetList.length) {
    //   this.ganttComponentInstance.changeCurrentTime(0);
    //   setTimeout(() => this.handleChangeVideoSet(newIndex), 100);
    // }
  }

  onRemoveScene(sceneName: string) {
    const index = this.selectedScenes.findIndex(item => item.name === sceneName);
    if (index > -1) {
      this.isClickedRemoveScene = true;
      this.selectedScenes.splice(index, 1);
    }
  }

  private getVideoSetIdBySceneName(taskName: string) {
    this.reportPreviews.forEach((item: ReportingPreviewModel) => {
      if (item.sceneNames.includes(taskName)) {
        if (!this.videoSetsIdFilteredBySceneName.includes(item.videoSetId)) {
          this.videoSetsIdFilteredBySceneName.push(item.videoSetId);
        }
      }
    });
  }

  private reLoadVideoSets() {
    this.reportService.getListVideoSetReport(this.videoSetsIdFilteredBySceneName).subscribe(
      res => {
        this.videoSetList = res.video_details;
        this.indexSelect = ((this.videoSetList.length - 1) >= this.indexSelect) ? this.indexSelect : 0;
        this.handleChangeVideoSet(this.indexSelect);
      },
      () => this.spinnerService.hide()
    );
  }

  handleZoomClick(direction: number) {
    const { MIN_ZOOM, MAX_ZOOM, STEP_ZOOM } = ZOOM_OPTIONS;
    const kZoomTemp = (this.currentZoom * 10 * 10 + direction * STEP_ZOOM * 100) / 100;
    if (kZoomTemp <= MAX_ZOOM && kZoomTemp >= MIN_ZOOM) {
      this.currentZoom = kZoomTemp;
      this.ganttComponentInstance.handleZoom(this.currentZoom);
    }
  }

  handleUpdateValueLeftPos(event: MouseEvent) {
    this.valueLeftPos = event.offsetX - 25;
    this.valueLeftPos = Math.max(-16, Math.min(216, this.valueLeftPos));
  }

  handleZoom(event: MouseEvent) {
    this.showValueZoom = false;
    this.ganttComponentInstance.handleZoom(this.currentZoom);
  }

}
