import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Gantt } from '../../../../../assets/ts/ganttchart';
import { DateUtil } from '@app/shared/utils/date';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { SceneTagService } from '@app/core/services/component-services/scene-tag.service';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';
import { MatMenuTrigger } from '@angular/material';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { VideoEditXmlService } from '@app/core/services/server-services/video-edit-xml.service';
import { DASHBOARD_EDIT_XML, EDIT_XML_ACTION, messageConstant } from '@app/configs/app-constants';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { ColorUtil } from '@app/shared/utils/color';
import { ActionStatus, SaveDraftStatus, SceneBar, SceneBarParams, SceneParams } from '@app/shared/models/editXMLDataModel';
import { ToastrService } from 'ngx-toastr';
import { isNgTemplate } from '@angular/compiler';

@Component({
  selector: 'app-gantt-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss']
})
export class GanttChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, AfterViewChecked {
  constructor(
    private dateUtil: DateUtil,
    private dashboardService: DashboardService,
    private videoChartService: VideoChartService,
    private scenetagService: SceneTagService,
    private videoChartCommentService: VideoChartCommentService,
    private ganttLineService: GanttLineService,
    private spinnerService: SpinnerService,
    private videoEditXMLService: VideoEditXmlService,
    private dialogService: DialogService,
    private toast: ToastrService
  ) {
    this.gantt = undefined;
    this.previousDragTime = 0;
    this.sceneFiltered = [];
    this.tagFiltered = [];
  }
  @ViewChild('ganttArea', { static: false }) ganttArea: ElementRef;
  @ViewChild(MatMenuTrigger, { static: false }) contextMenu: MatMenuTrigger;

  @Input() taskTypes = { taskName: [], taskNameDisplay: [] };
  @Input() tasksFormated: any[];
  @Input() numTypeOfXML: any[]; // store length unique array type of XML
  @Input() durationInView = 90;
  @Input() isAddNewSceneScalingTime = false;

  // Drag division time bar
  @Input() isDragDivision = true;
  @Output() currentTimeChange = new EventEmitter<any>();
  @Output() videoEnded = new EventEmitter<any>();

  gantt: Gantt;
  mileStoneDate = 0;
  endMileStoneDate: any;
  maxDate: any;
  minDate: any;
  format = '%M:%S';
  previousDragTime = 0;
  // From chart
  sceneClicked = '';
  // From leftside filter
  sceneFiltered: any[];
  tagFiltered: any[];
  from = 'gantt';
  isPlay = false;
  speed = 1;
  dragging = false;
  nextSceneTimeOutIds = [];
  endBar = false;
  barSelected: any;

  listCommentInChart: any[];

  // Flag change is play to true when drag
  flagChangePlayInDrag = false;

  // For context menu
  contextMenuPosition = { x: '0px', y: '0px' };

  currentTimeTemp = -1;
  subscriptions = new Array<Subscription>();

  // Max duration video
  maxVideoDuration = 0;

  // For editing XML:
  isExistedSceneBar = false;
  preLeftRightNewSceneList = [];
  objBeforeEdit: any;
  sceneNameAddNewFromLeftSide = '';
  @Input() isEditXML = false;
  @Input() xmlId = -1;
  clientWidthChart = 0;

  ngOnInit() {
    this.sceneFiltered = [];
    this.tagFiltered = [];

    if (this.isEditXML) {
      //CNQT 14Oct2021: init objBeforeEdit
      this.objBeforeEdit = {
        status: true,
        numTypeOfXMLLength: 0,
        taskTypes: [],
        tasksFormated: []
      };

      this.subscriptions.push(this.videoEditXMLService.saveDraftStatus.subscribe((data: SaveDraftStatus) => {
        if (data) {
          if (data.draftSavedNewSceneBarOfExistScene) {
            this.spinnerService.show();
            this.videoEditXMLService.obsNewScene.value.sceneBars.forEach(item => {
              if (!item.isOriginSceneBar) {
                const newTaskFormat = {
                  taskName: `_${this.videoEditXMLService.xmlId}-${this.videoEditXMLService.obsNewScene.value.sceneName}`,
                  taskNameDisplay: this.videoEditXMLService.obsNewScene.value.sceneName,
                  description: [],
                  endDate: item.endTime,
                  startDate: item.startTime,
                  color: ColorUtil.hexToRgb(this.videoEditXMLService.obsNewScene.value.sceneColor),
                  id: this.tasksFormated.length,
                  select: false
                };
                this.tasksFormated.push(newTaskFormat);
                item.isOriginSceneBar = true;
              }
            });
            this.buildGanttNewSceneScalingTime(this.tasksFormated);
            this.spinnerService.hide();
            this.toast.success(messageConstant.SCENE_BAR.ADD_NEW_SUCCESS);
          }
        }

      }));

      this.subscriptions.push(this.videoEditXMLService.currentBtnEditIsClickedID.subscribe(xmlId => {
        if (xmlId !== -1) {
          this.isEditXML = true;
          this.xmlId = xmlId;
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.sceneDeleted.subscribe(sceneName => {
        if (sceneName) {
          const indexTaskName = this.taskTypes.taskName.findIndex(item => item === `_${this.xmlId}-${sceneName}`);
          const indexTaskNameDisplay = this.taskTypes.taskNameDisplay.findIndex(item => item === sceneName);
          this.taskTypes.taskName.splice(indexTaskName, 1);
          this.taskTypes.taskNameDisplay.splice(indexTaskNameDisplay, 1);
          this.numTypeOfXML[0].length--;

          const indexTaskName02 = this.objBeforeEdit.taskTypes.taskName.findIndex(item => item === `_${this.xmlId}-${sceneName}`);
          const indexTaskNameDisplay02 = this.objBeforeEdit.taskTypes.taskNameDisplay.findIndex(item => item === sceneName);
          if (indexTaskName02 > -1 && indexTaskName02 > -1) {
            this.objBeforeEdit.taskTypes.taskName.splice(indexTaskName02, 1);
            this.objBeforeEdit.taskTypes.taskNameDisplay.splice(indexTaskNameDisplay02, 1);
          }
          this.objBeforeEdit.numTypeOfXMLLength--;

          const tempTaskFormated = this.tasksFormated.filter(item => item.taskNameDisplay !== sceneName);
          const tempTaskFormatedInObjBeforeEdit = this.objBeforeEdit.tasksFormated.filter(item => item.taskNameDisplay !== sceneName);
          this.tasksFormated = tempTaskFormated;
          this.objBeforeEdit.tasksFormated = tempTaskFormatedInObjBeforeEdit;


          this.scenetagService.removeScene(this.from, sceneName, true);
          this.videoEditXMLService.objSceneClicked.sceneBars = [];
          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGantt();
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.sceneBarDeleted.subscribe((sceneBarId: number) => {
        if (sceneBarId > -1) {
          const index = this.tasksFormated.findIndex(item => +item.barId === sceneBarId);
          const indexScenebar = this.videoEditXMLService.objSceneClicked.sceneBars.findIndex(item => +item.id === sceneBarId);
          const indexScenebarInObjBefore = this.objBeforeEdit.tasksFormated.findIndex(item => +item.barId == sceneBarId);
          if (index > -1) {
            this.tasksFormated.splice(index, 1);
            this.videoEditXMLService.objSceneClicked.sceneBars.splice(indexScenebar, 1);
            this.objBeforeEdit.tasksFormated.splice(indexScenebarInObjBefore, 1);
            this.videoEditXMLService.obsResetDefaultTimeline.next(true);
            this.buildGanttNewSceneScalingTime(this.tasksFormated);
            this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
              this.syncGanttChartToTimeline(item.id);
            });
          }
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.obsNewScene.subscribe(objNewScene => {
        if (!!this.gantt
          && objNewScene
          && this.videoEditXMLService.obsNewScene.value.isAddedFrom === EDIT_XML_ACTION.ADD_NEW_BY_LEFT_SIDE_BUTTON) {
          this.videoEditXMLService.sceneNameAddNewFromLeftSide = objNewScene.sceneName;
          if (this.tasksFormated.length > 0) {
            const xmlId = this.videoEditXMLService.xmlId;
            if (xmlId > -1) {
              this.numTypeOfXML[0].length = 2;
              const curTaskType = [
                '_' + xmlId + '-' + objNewScene.sceneName,
                'xml' + xmlId + 'footer'
              ];
              const curTaskNameDisplay = [
                objNewScene.sceneName,
                ''
              ];
              this.taskTypes = {
                taskName: curTaskType,
                taskNameDisplay: curTaskNameDisplay
              };
              this.tasksFormated = [{
                taskName: '_' + xmlId + '-' + objNewScene.sceneName,
                taskNameDisplay: objNewScene.sceneName,
                description: [],
                endDate: this.videoEditXMLService.maxVideoDuration,
                startDate: 0,
                color: 'rgb(255,255,255)',
                id: -1,
                select: false
              }];
              this.videoEditXMLService.obsNewScene.value.sceneBars.forEach(item => {
                this.tasksFormated.push({
                  taskName: '_' + xmlId + '-' + objNewScene.sceneName,
                  taskNameDisplay: objNewScene.sceneName,
                  description: [],
                  endDate: item.endTime,
                  startDate: item.startTime,
                  color: ColorUtil.hexToRgb(objNewScene.sceneColor),
                  id: item.id,
                  select: false
                });
              });
              this.isAddNewSceneScalingTime = true;
              this.buildGanttNewSceneScalingTime(this.tasksFormated);
            }
          }
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.obsActionStatus.subscribe((actionStatus: ActionStatus) => {
        if (this.gantt && actionStatus && actionStatus.letUpdateUIScene && actionStatus.letShowEditScene) {
          this.gantt.objEditingSceneBar.isEditing = false;
          this.videoEditXMLService.isEditingSceneBar = false;
          this.gantt.handleBarClickEditXML(this.gantt.barSelected, this.gantt.barSelected.index);
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.obsScalingBarTimeline.subscribe(status => {
        if (status && !!this.gantt) {
          this.videoEditXMLService.isEditingSceneBar = true;
          this.gantt.onHandleScalingFromSceneBarTimeline(this.videoEditXMLService.objSceneBarScaling);
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.obsRevertSceneBar.subscribe(status => {
        if (status && !!this.gantt) {
          const index = this.tasksFormated.findIndex(item => item.barId === this.videoEditXMLService.objSceneBarClicked.id);
          if (index > -1) {
            this.tasksFormated[index].startDate = this.videoEditXMLService.objSceneBarClicked.startTime;
            this.tasksFormated[index].endDate = this.videoEditXMLService.objSceneBarClicked.endTime;
          }
          this.gantt.onRevertSceneBarGanttChart(this.videoEditXMLService.objSceneBarClicked);
        }
      }));

      this.subscriptions.push(this.videoEditXMLService.rspOnSaveNewSceneBarToExistedScene.subscribe((data: SceneBarParams) => {
        if (data) {
          this.spinnerService.show();
          const newTaskFormat = {
            taskName: `_${data.xml_id}-${data.scene_bar_name}`,
            taskNameDisplay: data.scene_bar_name,
            description: [],
            endDate: data.scene_bar_end,
            startDate: data.scene_bar_start,
            color: data.scene_bar_color,
            id: data.scene_bar_id.toString(),
            barId: data.scene_bar_id,
            select: false
          };
          this.objBeforeEdit.tasksFormated.push(newTaskFormat);
          newTaskFormat.id = 'bar-' + newTaskFormat.id;
          this.tasksFormated.push(newTaskFormat);

          this.tasksFormated.sort((a, b) => a.startDate - b.startDate);

          let index = 0;
          const result = [];
          const temps = this.tasksFormated.filter(item => item.taskNameDisplay === data.scene_bar_name);
          this.videoEditXMLService.sceneNameAddNewFromLeftSide = data.scene_bar_name;
          result.push(
            {
              isCoverSceneBar: true,
              id: 'bar-' + 0,
              taskName: '_' + this.videoEditXMLService.xmlId + '-' + data.scene_bar_name,
              taskNameDisplay: data.scene_bar_name,
              objPreLeftRight: {
                preLeft: -1,
                subRight: -1
              },
              leftPathId: 'pathLeft-startStop-' + 0,
              rightPathId: 'pathRight-startStop-' + 0,
              maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
              widthSVG: this.videoEditXMLService.widthSVG,
              description: [],
              endDate: this.videoEditXMLService.maxVideoDuration,
              startDate: 0,
              color: 'rgb(255,255,255)',
              select: false
            });
          this.videoEditXMLService.objSceneClicked.sceneBars = [];

          if (!this.videoEditXMLService.isAddNewScene) {
            const indexFind = temps.findIndex(item => item.isCoverSceneBar);
            if (indexFind > -1)
              temps.splice(indexFind, 1);
            temps.forEach(item => {
              const objSceneBar = new SceneBar();
              objSceneBar.id = item.barId;
              objSceneBar.startTime = item.startDate;
              objSceneBar.endTime = item.endDate;
              objSceneBar.preLeft = (index > 0) ? temps[index - 1].endDate : -1;
              objSceneBar.subRight = (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration;
              objSceneBar.isOriginSceneBar = true;
              objSceneBar.tags = item.description;
              this.videoEditXMLService.objSceneClicked.sceneBars.push(objSceneBar);

              const obj = {
                barId: item.barId,
                id: item.id,
                taskName: item.taskName,
                taskNameDisplay: item.taskNameDisplay,
                objPreLeftRight: {
                  preLeft: (index > 0) ? temps[index - 1].endDate : -1,
                  subRight: (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration
                },
                leftPathId: 'pathLeft-startStop-' + (index + 1),
                rightPathId: 'pathRight-startStop-' + (index + 1),
                maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
                widthSVG: this.videoEditXMLService.widthSVG,
                description: item.description,
                endDate: item.endDate,
                startDate: item.startDate,
                color: item.color,
                select: item.select
              };
              result.push(obj);
              ++index;
            });
          }
          this.gantt
          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(result);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
          this.spinnerService.hide();
          this.toast.success(messageConstant.SCENE_BAR.ADD_NEW_SUCCESS);
        }
      }))

      this.subscriptions.push(this.videoEditXMLService.rspOnSaveNewSceneBarsToExistedScene.subscribe((data_s: SceneBarParams[]) => {
        if (data_s) {
          for (var i = 0; i <= data_s.length - 1; i++) {
            this.spinnerService.show();
            let data = data_s[i];
            const newTaskFormat = {
              taskName: `_${data.xml_id}-${data.scene_bar_name}`,
              taskNameDisplay: data.scene_bar_name,
              description: [],
              endDate: data.scene_bar_end,
              startDate: data.scene_bar_start,
              color: data.scene_bar_color,
              id: data.scene_bar_id.toString(),
              barId: data.scene_bar_id,
              select: false
            };
            this.objBeforeEdit.tasksFormated.push(newTaskFormat);
            newTaskFormat.id = 'bar-' + newTaskFormat.id;
            this.tasksFormated.push(newTaskFormat);
          }
          this.tasksFormated.sort((a, b) => a.startDate - b.startDate);

          let index = 0;
          const result = [];
          const temps = this.tasksFormated.filter(item => item.taskNameDisplay === data_s[0].scene_bar_name);
          this.videoEditXMLService.sceneNameAddNewFromLeftSide = data_s[0].scene_bar_name;
          result.push(
            {
              isCoverSceneBar: true,
              id: 'bar-' + 0,
              taskName: '_' + this.videoEditXMLService.xmlId + '-' + data_s[0].scene_bar_name,
              taskNameDisplay: data_s[0].scene_bar_name,
              objPreLeftRight: {
                preLeft: -1,
                subRight: -1
              },
              leftPathId: 'pathLeft-startStop-' + 0,
              rightPathId: 'pathRight-startStop-' + 0,
              maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
              widthSVG: this.videoEditXMLService.widthSVG,
              description: [],
              endDate: this.videoEditXMLService.maxVideoDuration,
              startDate: 0,
              color: 'rgb(255,255,255)',
              select: false
            });
          this.videoEditXMLService.objSceneClicked.sceneBars = [];

          if (!this.videoEditXMLService.isAddNewScene) {
            const indexFind = temps.findIndex(item => item.isCoverSceneBar);
            if (indexFind > -1)
              temps.splice(indexFind, 1);
            temps.forEach(item => {
              const objSceneBar = new SceneBar();
              objSceneBar.id = item.barId;
              objSceneBar.startTime = item.startDate;
              objSceneBar.endTime = item.endDate;
              objSceneBar.preLeft = (index > 0) ? temps[index - 1].endDate : -1;
              objSceneBar.subRight = (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration;
              objSceneBar.isOriginSceneBar = true;
              objSceneBar.tags = item.description;
              this.videoEditXMLService.objSceneClicked.sceneBars.push(objSceneBar);

              const obj = {
                barId: item.barId,
                id: item.id,
                taskName: item.taskName,
                taskNameDisplay: item.taskNameDisplay,
                objPreLeftRight: {
                  preLeft: (index > 0) ? temps[index - 1].endDate : -1,
                  subRight: (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration
                },
                leftPathId: 'pathLeft-startStop-' + (index + 1),
                rightPathId: 'pathRight-startStop-' + (index + 1),
                maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
                widthSVG: this.videoEditXMLService.widthSVG,
                description: item.description,
                endDate: item.endDate,
                startDate: item.startDate,
                color: item.color,
                select: item.select
              };
              result.push(obj);
              ++index;
            });
          }

          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(result);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
          this.spinnerService.hide();
          this.toast.success(messageConstant.SCENE_BAR.ADD_NEW_SUCCESS);
        }
      }))

      this.subscriptions.push(this.videoEditXMLService.rspOnSaveOldSceneBarToExistedScene.subscribe((data: SceneBarParams) => {
        if (data) {
          this.spinnerService.show();
          const indexFind = this.tasksFormated.findIndex(item => +item.barId == data.scene_bar_id);
          const indexInObjBeforeEdit = this.objBeforeEdit.tasksFormated.findIndex(item => item.barId == data.scene_bar_id);
          const indexInSceneBar = this.videoEditXMLService.objSceneClicked.sceneBars.findIndex(item => item.id == data.scene_bar_id);
          this.tasksFormated[indexFind].startDate = data.scene_bar_start;
          this.tasksFormated[indexFind].endDate = data.scene_bar_end;
          this.tasksFormated[indexFind].color = data.scene_bar_color;
          this.tasksFormated[indexFind].description = [];
          data.labels.forEach(item => this.tasksFormated[indexFind].description.push(item.tag_name));

          this.objBeforeEdit.tasksFormated[indexInObjBeforeEdit].startDate = data.scene_bar_start;
          this.objBeforeEdit.tasksFormated[indexInObjBeforeEdit].endDate = data.scene_bar_end;
          this.objBeforeEdit.tasksFormated[indexInObjBeforeEdit].color = data.scene_bar_color;
          this.objBeforeEdit.tasksFormated[indexInObjBeforeEdit].description = [];
          data.labels.forEach(item => this.objBeforeEdit.tasksFormated[indexInObjBeforeEdit].description.push(item.tag_name));

          this.videoEditXMLService.objSceneClicked.sceneBars[indexInSceneBar].startTime = Number(data.scene_bar_start);
          this.videoEditXMLService.objSceneClicked.sceneBars[indexInSceneBar].endTime = Number(data.scene_bar_end);

          this.tasksFormated.sort((a, b) => a.startDate - b.startDate);

          let index = 0;
          const result = [];
          const temps = this.tasksFormated.filter(item => item.taskNameDisplay === data.scene_bar_name);
          this.videoEditXMLService.sceneNameAddNewFromLeftSide = data.scene_bar_name;
          result.push(
            {
              isCoverSceneBar: true,
              id: 'bar-' + 0,
              taskName: '_' + this.videoEditXMLService.xmlId + '-' + data.scene_bar_name,
              taskNameDisplay: data.scene_bar_name,
              objPreLeftRight: {
                preLeft: -1,
                subRight: -1
              },
              leftPathId: 'pathLeft-startStop-' + 0,
              rightPathId: 'pathRight-startStop-' + 0,
              maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
              widthSVG: this.videoEditXMLService.widthSVG,
              description: [],
              endDate: this.videoEditXMLService.maxVideoDuration,
              startDate: 0,
              color: 'rgb(255,255,255)',
              select: false
            });
          this.videoEditXMLService.objSceneClicked.sceneBars = [];

          if (!this.videoEditXMLService.isAddNewScene) {
            const indexFind = temps.findIndex(item => item.isCoverSceneBar);
            if (indexFind > -1)
              temps.splice(indexFind, 1);
            temps.forEach(item => {
              const objSceneBar = new SceneBar();
              objSceneBar.id = item.barId;
              objSceneBar.startTime = item.startDate;
              objSceneBar.endTime = item.endDate;
              objSceneBar.preLeft = (index > 0) ? temps[index - 1].endDate : -1;
              objSceneBar.subRight = (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration;
              objSceneBar.isOriginSceneBar = true;
              objSceneBar.tags = item.description;
              this.videoEditXMLService.objSceneClicked.sceneBars.push(objSceneBar);

              const obj = {
                barId: item.barId,
                id: item.id,
                taskName: item.taskName,
                taskNameDisplay: item.taskNameDisplay,
                objPreLeftRight: {
                  preLeft: (index > 0) ? temps[index - 1].endDate : -1,
                  subRight: (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration
                },
                leftPathId: 'pathLeft-startStop-' + (index + 1),
                rightPathId: 'pathRight-startStop-' + (index + 1),
                maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
                widthSVG: this.videoEditXMLService.widthSVG,
                description: item.description,
                endDate: item.endDate,
                startDate: item.startDate,
                color: item.color,
                select: item.select
              };
              result.push(obj);
              ++index;
            });
          }

          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(result);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
          this.spinnerService.hide();
        }
      }))

      this.subscriptions.push(this.videoEditXMLService.rspOnSaveNewScene.subscribe((data: SceneParams) => {
        if (data) {
          this.spinnerService.show();

          if (this.objBeforeEdit.numTypeOfXMLLength != 0)
            this.objBeforeEdit.numTypeOfXMLLength++;
          else
            this.objBeforeEdit.numTypeOfXMLLength = 2;

          this.taskTypes.taskName[0] = "_" + this.xmlId + "-" + data.scene_name;
          this.taskTypes.taskNameDisplay[0] = data.scene_name;
          if (this.objBeforeEdit.taskTypes.taskName.length <= 0)
            this.objBeforeEdit.taskTypes = this.taskTypes;
          else {
            this.objBeforeEdit.taskTypes.taskName.unshift(this.taskTypes.taskName[0]);
            this.objBeforeEdit.taskTypes.taskNameDisplay.unshift(this.taskTypes.taskNameDisplay[0]);
          }

          if (!this.numTypeOfXML || this.numTypeOfXML.length == 0)
            this.numTypeOfXML.push({ name: this.videoEditXMLService.xmlName, length: 2 });

          const result = [];
          result.push(
            {
              isCoverSceneBar: true,
              id: 'bar-' + 0,
              taskName: '_' + this.videoEditXMLService.xmlId + '-' + data.scene_name,
              taskNameDisplay: data.scene_name,
              objPreLeftRight: {
                preLeft: -1,
                subRight: -1
              },
              leftPathId: 'pathLeft-startStop-' + 0,
              rightPathId: 'pathRight-startStop-' + 0,
              maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
              widthSVG: this.videoEditXMLService.widthSVG,
              description: [],
              endDate: this.videoEditXMLService.maxVideoDuration,
              startDate: 0,
              color: 'rgb(255,255,255)',
              select: false
            });
          this.videoEditXMLService.objSceneClicked.sceneBars = [];
          this.scenetagService.addScene(this.from, data.scene_name, true);
          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(result);
          this.spinnerService.hide();
          this.toast.success(messageConstant.SCENE_BAR.ADD_NEW_SUCCESS);
        }
      }))

      this.subscriptions.push(this.videoEditXMLService.rspOnSaveOldScene.subscribe((data: SceneParams) => {
        if (data) {
          this.spinnerService.show();
          const oldTaskName = this.taskTypes.taskName[0];
          this.taskTypes.taskName[0] = "_" + this.xmlId + "-" + data.scene_name;
          this.taskTypes.taskNameDisplay[0] = data.scene_name;

          const indexTaskType = this.objBeforeEdit.taskTypes.taskNameDisplay.findIndex(item => item == this.videoEditXMLService.objSceneClicked.oldSceneName);
          if (indexTaskType > -1) {
            this.objBeforeEdit.taskTypes.taskName[indexTaskType] = "_" + this.xmlId + "-" + data.scene_name;
            this.objBeforeEdit.taskTypes.taskNameDisplay[indexTaskType] = data.scene_name;
          }
          for (var i = 0; i <= this.tasksFormated.length - 1; i++) {
            if (this.tasksFormated[i].isCoverSceneBar) continue;
            this.tasksFormated[i].taskName = this.taskTypes.taskName[0];
            this.tasksFormated[i].taskNameDisplay = this.taskTypes.taskNameDisplay[0];
            this.tasksFormated[i].color = data.scene_color;
          }

          for (var i = 0; i <= this.objBeforeEdit.tasksFormated.length - 1; i++) {
            if (this.objBeforeEdit.tasksFormated[i].taskName == oldTaskName
              && !this.objBeforeEdit.tasksFormated[i].isCoverSceneBar) {
              this.objBeforeEdit.tasksFormated[i].taskName = this.taskTypes.taskName[0];
              this.objBeforeEdit.tasksFormated[i].taskNameDisplay = this.taskTypes.taskNameDisplay[0];
              this.objBeforeEdit.tasksFormated[i].color = data.scene_color;
            }
          }

          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(this.tasksFormated);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
          this.spinnerService.hide();
        }
      }))

      this.subscriptions.push(this.videoEditXMLService.removeAllRecordingSceneBars.subscribe((data) => {
        if (data) {
          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.buildGanttNewSceneScalingTime(this.tasksFormated);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
        }
      }))

      // this.subscriptions.push(this.videoEditXMLService.removeAllRecordingSceneBars.subscribe((data) => {
      //   if (data) {
      //     this.videoEditXMLService.obsResetDefaultTimeline.next(true);
      //     this.buildGanttNewSceneScalingTime(this.tasksFormated);
      //     this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
      //       this.syncGanttChartToTimeline(item.id);
      //     });
      //   }
      // }))

      this.subscriptions.push(this.videoEditXMLService.cancelChangesSceneBars.subscribe((data) => {
        if (data) {
          this.videoEditXMLService.obsRevertSceneBar.next(true);
          this.videoEditXMLService.removeAllRecordingSceneBars.next(true);
          this.videoEditXMLService.isEditingSceneBar = false;
          this.gantt.objEditingSceneBar.isEditing = false;
          this.gantt.barSelected = null;
          // this.gantt.handleBarClickEditXML(this.gantt.objEditingSceneBar.data, this.gantt.objEditingSceneBar.index);
          // setTimeout(() => {

          // }, 200);
        }
      }))


    }
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(this.videoChartService.getData().subscribe(rs => {
      if (!!this.gantt) {
        this.gantt.isPlaying = rs.play;
        this.gantt.currentTimeSceneBarIsChosen = rs.currentTime;
      }
      this.isPlay = rs.play;
      this.speed = rs.speed;
      if (!rs.play && !!this.gantt) {
        this.nextSceneTimeOutIds.forEach(id => clearTimeout(id));
        this.gantt.setIsSliding(false);
        this.gantt.resetTransition();
        if (rs.isSeek && !!this.gantt && !rs.isDragCentral) {
          this.gantt.setIsSliding(true); // update time by rs.currentTime
          this.gantt.resetTransition();
          this.gantt.redraw(false, rs.currentTime, null, rs.speed);

          // Raise only pause
          // Use in comment
          // this.videoChartCommentService.listSceneActive.next(this.gantt.getListSceneActive());
        }
      } else {
        // playing
        if (!rs.isSeek && !!this.gantt) {
          this.gantt.setIsSliding(true); // update time by rs.currentTime
          if (rs.currentTime <= Math.floor(rs.duration)) {
            if (this.barSelected && this.barSelected.id
              && this.barSelected.endDate < Math.floor(rs.currentTime)
              && this.endBar) {
              this.videoChartService.seek(true, this.barSelected.startDate);
              this.videoChartService.seekEnd();
              this.endBar = false;
              return;
            }

            if (!this.barSelected || !this.barSelected.id
              || this.barSelected.endDate !== Math.floor(rs.currentTime)) {
              if (Math.floor(rs.currentTime + 1) !== this.currentTimeTemp) {
                this.currentTimeTemp = Math.floor(rs.currentTime + 1);
                this.gantt.redraw(true, rs.currentTime + 1, null, rs.speed);
              }
            }
          }
        }
        if (rs.isSeek && !!this.gantt && !rs.isDragCentral) {
          this.gantt.setIsSliding(true);
          this.gantt.resetTransition();
          let tempTime = rs.currentTime;
          if (this.barSelected && this.barSelected.id) {
            tempTime = Math.max(tempTime, this.barSelected.startDate);
            tempTime = Math.min(tempTime, this.barSelected.endDate);
          }
          this.gantt.redraw(false, tempTime, null, rs.speed);
        }
      }
      this.currentTimeChange.emit(rs.currentTime);
    }));

    this.subscriptions.push(this.videoChartService.ended.subscribe(() => this.videoEnded.emit()));

    // next/previous scene

    this.subscriptions.push(this.videoChartService.scene.subscribe(key => {
      if (key !== 0) {
        const currentTimeInXML = this.gantt.getTimeDomainMiddle();
        let nextSceneTime;
        const startIndex = this.gantt.getTheLastSceneActiveIndex(); // 0 or a number of the last bar active
        if (this.sceneFiltered.length === 0 || this.tagFiltered.length === 0) {
          nextSceneTime = this.getNextScene(currentTimeInXML, key, startIndex);
        } else {
          nextSceneTime = this.getNextSceneFiltered(currentTimeInXML, key);
        }
        this.videoChartService.seek(true, nextSceneTime);
        this.videoChartService.seekEnd();
      }
    }));

    this.subscriptions.push(this.scenetagService.scenes.subscribe(({ from, newList, isClickBtnEditXML, isRemoveScene }) => {
      if (isClickBtnEditXML && !isRemoveScene) {
        if (newList.length == 0) {
          this.objBeforeEdit.tasksFormated = [];
          if (this.tasksFormated && this.tasksFormated.length > 0)
            this.tasksFormated.forEach(item => this.objBeforeEdit.tasksFormated.push(item));
          if (this.numTypeOfXML && this.numTypeOfXML[0])
            this.objBeforeEdit.numTypeOfXMLLength = this.numTypeOfXML[0].length;
          this.objBeforeEdit.taskTypes = this.taskTypes ? this.taskTypes : this.objBeforeEdit.taskTypes;
        }

        const filterTasksFormatted = this.filterSceneToEditXML(newList[0]);
        const xmlId = this.videoEditXMLService.xmlId;
        if (xmlId > -1 && newList.length > 0) {
          const curTaskType = [
            '_' + xmlId + '-' + newList[0],
            'xml' + xmlId + 'footer'
          ];
          const curTaskNameDisplay = [
            newList[0],
            ''
          ];
          this.taskTypes = {
            taskName: curTaskType,
            taskNameDisplay: curTaskNameDisplay
          };

          if (this.numTypeOfXML && !this.numTypeOfXML[0])
            this.numTypeOfXML.push({ name: this.videoEditXMLService.xmlName, length: 0 });


          this.numTypeOfXML[0].length = 2;
          this.objBeforeEdit.status = true;
          this.isAddNewSceneScalingTime = true;
          this.buildGanttNewSceneScalingTime(filterTasksFormatted);
          this.videoEditXMLService.objSceneClicked.sceneBars.forEach(item => {
            this.syncGanttChartToTimeline(item.id);
          });
        }
      }
      else {
        if (this.objBeforeEdit && this.objBeforeEdit.status && this.numTypeOfXML[0]) {
          this.numTypeOfXML[0].length = this.objBeforeEdit.numTypeOfXMLLength;
          this.taskTypes = this.objBeforeEdit.taskTypes;
          this.tasksFormated = this.objBeforeEdit.tasksFormated;
          this.objBeforeEdit.status = false;

          this.isAddNewSceneScalingTime = false;
          this.buildGantt();
        }
        if (this.from !== from && !!this.gantt) {
          this.sceneClicked = '';
          this.sceneFiltered = newList;
          this.videoChartCommentService.scene.next('');
          this.gantt.setSceneFiltered(this.sceneFiltered);
          if (this.sceneFiltered.length === 0) {
            this.gantt.filterAllScene();
          } else {
            this.gantt.removeFilterAllScene();
            this.sceneFiltered.forEach(scene => {
              if (!this.gantt.filterAScene(scene)) {
                const timeToSeek = this.getNextSceneFiltered(this.gantt.getTimeDomainMiddle());
                this.videoChartService.seek(true, timeToSeek);
                this.videoChartService.seekEnd();
              }
            });
          }
        }
      }
    }));

    this.subscriptions.push(this.scenetagService.tags.subscribe(({ from, newList }) => {
      if (this.from !== from && !!this.gantt && this.gantt.tasks && this.gantt.tasks.length >= 0) {
        this.tagFiltered = newList;
        if (this.tagFiltered) {
          this.gantt.setTagFiltered(this.tagFiltered);
          if (!this.gantt.isSceneWithTagFilterActive()) {
            const timeToSeek = this.getNextSceneFiltered(this.gantt.getTimeDomainMiddle());
            this.videoChartService.seek(true, timeToSeek);
            this.videoChartService.seekEnd();
          }
        }
      }
    }));

    this.subscriptions.push(this.videoChartCommentService.listCommentInChart.subscribe(list => {
      this.listCommentInChart = list;
      if (!!this.gantt) {
        this.gantt.setListComment(this.listCommentInChart);
        this.gantt.drawComment();
      }
    }));

    this.subscriptions.push(this.videoChartCommentService.timeCommentClick.subscribe(commentInfo => {
      if (commentInfo.timeInVideo !== -1) {
        if (commentInfo.sceneName === '') {
          if (this.gantt) {
            this.barSelected = this.gantt.handleCommentClick(null, -1) ? this.gantt.handleCommentClick(null, -1) : {};
          }
          this.videoChartService.setBarSelected({});
        } else {
          const tempTime = this.dateUtil.secondsToDate(commentInfo.timeInVideo);
          const indexInList = this.tasksFormated.findIndex(
            task =>
              task.startDate <= tempTime && task.endDate >= tempTime && commentInfo.sceneName === task.taskNameDisplay
          );

          if (this.gantt) {
            this.barSelected = this.gantt.handleCommentClick(this.tasksFormated[indexInList], indexInList);
          }
          this.videoChartService.setBarSelected(this.barSelected);
        }
      }
    }),
    );

    this.subscriptions.push(this.videoChartService.duration.subscribe(d => {
      if (d > this.maxVideoDuration) {
        this.maxVideoDuration = d;
        this.maxDate = Math.max(...this.tasksFormated.map(task => task.endDate), this.maxVideoDuration);
      }
      else
        this.maxVideoDuration = this.videoChartService.maxDuration
      if (this.gantt)
        this.gantt.setMileStoneDates([this.minDate, this.maxVideoDuration]);
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.tasksFormated.firstChange) {
      this.buildGantt(this.isAddNewSceneScalingTime);
      this.isAddNewSceneScalingTime = false;
    }
  }

  ngAfterViewChecked() {
    const { clientWidth } = this.ganttArea.nativeElement;
    if (this.clientWidthChart !== clientWidth) {
      if (this.clientWidthChart > 0 && this.gantt && this.isEditXML) {
        setTimeout(() => {
          this.buildGantt(this.isAddNewSceneScalingTime);
        }, 0)
      }
      this.clientWidthChart = clientWidth;
    }
  }

  buildGantt(isNewSceneScalingTime = false, isAllRemove = true) {
    this.barSelected = {};
    this.videoChartService.setBarSelected(this.barSelected);
    this.sceneClicked = '';
    this.videoChartCommentService.scene.next('');

    if (this.gantt && isAllRemove)
      this.gantt.removeAll();

    const { clientWidth, clientHeight, id } = this.ganttArea.nativeElement;
    this.endMileStoneDate = this.mileStoneDate + this.durationInView;
    this.maxDate = Math.max(...this.tasksFormated.map(task => task.endDate), this.maxVideoDuration); // Get max endDate in data
    this.minDate = this.mileStoneDate;
    this.tasksFormated.sort((a, b) => a.startDate - b.startDate); // Increase startDate sort
    this.initGantt(clientWidth, clientHeight, id);
    this.gantt.isAddNewSceneBar = isNewSceneScalingTime;
    if (!isNewSceneScalingTime) {
      this.gantt.isEditXML = this.isEditXML;
      this.gantt.build(this.tasksFormated, this.isDragDivision, clientWidth);
    }
    else {
      this.gantt.isEditXML = this.videoEditXMLService.isEditXMLGantt;
      this.gantt.sceneNameAddNewFromLeftSide = this.videoEditXMLService.sceneNameAddNewFromLeftSide;
      this.sceneNameAddNewFromLeftSide = this.videoEditXMLService.sceneNameAddNewFromLeftSide;
      this.gantt.buildNewSceneScalingTime(this.tasksFormated, this.isDragDivision, clientWidth);
    }

    if (this.isEditXML)
      this.videoEditXMLService.maxVideoDuration = Math.max(...this.tasksFormated.map(task => task.endDate), this.maxVideoDuration);

    this.currentTimeChange.emit(this.mileStoneDate);
  }

  initGantt(clientWidth, clientHeight, id) {
    // init primary chart
    let c = (this.maxDate - this.minDate) / 9;
    c = Math.floor(c / 2) * 2;
    if (this.gantt === undefined) {
      this.gantt = new Gantt(clientWidth, clientHeight, '#' + id, this.onRectClick.bind(this), this.videoChartService);
      this.gantt.setTimeDomain(this.mileStoneDate); // for draw xAxis tick
      this.gantt.setTickFormat(this.format);
      this.gantt.setDragCallback(this.onDragCallback.bind(this));
      this.gantt.setDragEndCallback(this.onDragEndCallback.bind(this));
      this.gantt.setDragStartCallback(this.onDragStartCallback.bind(this));
      this.gantt.setEndSceneCallback(this.onEndOfAScene.bind(this));
      this.gantt.setBarClickCallback(this.onBarClick.bind(this));
      this.gantt.setSceneClickCallback(this.onSceneClickEditXML.bind(this));
      this.gantt.setBarContextMenuCallback(this.onBarContextMenuCallback.bind(this));
      this.gantt.setResizeCallback(this.onResizeCallback.bind(this));
    } else {
      this.gantt.setTimeDomain(this.gantt.getTimeDomainMiddle()); // for draw xAxis tick
    }
    this.durationInView = Math.max(c, 90);
    this.gantt.setRangeTime(this.durationInView); // call before setTimeDomain
    this.ganttLineService.ganttTimeRangeChange.next(this.durationInView);
    this.gantt.setMileStoneDates([this.minDate, this.maxVideoDuration]); // for show specific xAxis tick
    this.gantt.setTaskTypes(this.taskTypes);
    this.gantt.setNumTypeOfXML(this.numTypeOfXML);
    this.gantt.setListComment(this.listCommentInChart);
  }

  // Click rect callback
  // Click tick callback
  onRectClick(tickClicked: any, sceneClick: any, enable: boolean) {
    this.barSelected = {};
    this.videoChartService.setBarSelected(this.barSelected);
    const time = this.gantt.getTimeDomainMiddle();
    this.videoChartService.seek(true, time);
    this.videoChartService.seekEnd();
    if (!!sceneClick) {
      if (this.sceneClicked === sceneClick) {
        this.sceneFiltered = [];
        this.sceneClicked = '';
      }
      //
      else if (enable) {
        // scene is filtered
        this.sceneClicked = sceneClick;
        this.sceneFiltered = [sceneClick];
        this.videoChartCommentService.listSceneActive.next(this.gantt.getListSceneActive());
      }
      this.videoChartCommentService.scene.next(this.sceneFiltered[0] || '');
      this.scenetagService.clearScene(this.from);
      if (enable) {
        this.scenetagService.addScene(this.from, sceneClick.trim());
      }
    }
  }

  onSceneClickEditXML(sceneSelected: any) {
    if (!this.videoEditXMLService.isAddNewScene || !this.videoEditXMLService.isEditingScene) {
      this.videoEditXMLService.objSceneBarClicked.id = -1;
      this.videoEditXMLService.setEditSceneContent.next(this.videoEditXMLService.objSceneBarClicked);
      this.videoEditXMLService.reClickScene.next(sceneSelected);
    }
  }

  onBarClick(barSelected: any) {
    //CNQT 29Oct2021:Remove condition in ifclause to ask when click another scenebar when scenebar selected editing.
    //if (this.isEditXML
    //&& barSelected.barId !== this.videoEditXMLService.objSceneBarClicked.id)
    if (this.isEditXML) {
      this.onBarClickEditXML(barSelected);
    }
    //
    else if (!this.isEditXML) {
      this.barSelected = barSelected;
      this.sceneClicked = barSelected.taskNameDisplay || '';
      this.sceneFiltered = [];
      let xmlId = -1;
      if (Object.keys(barSelected).length !== 0) {
        // tslint:disable-next-line:radix
        xmlId = parseInt(barSelected.taskName.substring(1, barSelected.taskName.indexOf('-')));
      }
      this.videoChartCommentService.xmlId.next(xmlId);
      this.videoChartCommentService.scene.next(this.sceneClicked);
      this.videoChartService.setBarSelected(this.barSelected);
      const time = this.gantt.getTimeDomainMiddle();
      this.videoChartService.seek(true, time);
      this.videoChartService.seekEnd();
      this.videoChartCommentService.listSceneActive.next(this.gantt.getListSceneActive());
      this.scenetagService.clearScene(this.from);
      this.currentTimeChange.emit(time);
    }
  }

  onDragCallback(newStartTimeToMiddleRange?: number) {
    const isDragCentral = !!newStartTimeToMiddleRange || newStartTimeToMiddleRange === 0;
    const time = this.gantt.getTimeDomainMiddle();
    if (time !== this.previousDragTime) {
      this.previousDragTime = time;
      this.endBar = false;
      if (this.isPlay) {
        this.videoChartService.changeIsPlay(false);
        this.flagChangePlayInDrag = true;
      }
      this.videoChartService.seek(true, time, isDragCentral);
      this.videoChartService.seekEnd();
      if (isDragCentral) {
        this.ganttLineService.startToMiddleRangeChange.next(newStartTimeToMiddleRange);
      }
    }
  }

  onDragEndCallback(newStartTimeToMiddleRange?: number) {
    if (!this.isEditXML) {
      if (!newStartTimeToMiddleRange && newStartTimeToMiddleRange !== 0) {
        this.dragging = false;
        this.videoChartCommentService.listSceneActive.next(this.gantt.getListSceneActive());
        if (!this.isPlay && this.flagChangePlayInDrag) {
          this.videoChartService.changeIsPlay(true);
          this.flagChangePlayInDrag = false;
        }
        this.currentTimeChange.emit(this.previousDragTime);
      } else {
        this.ganttLineService.startToMiddleRangeChange.next(newStartTimeToMiddleRange);
      }
    } else {
      this.onDragEndCallbackEditXML(newStartTimeToMiddleRange);
    }

  }

  onDragStartCallback() {
    this.dragging = true;
  }

  onResizeCallback(newSize: number) {
    this.ganttLineService.ganttResize.next(newSize);
  }

  onEndOfAScene(endBar: boolean = false, barSelected = {}, endBarTime: number = 0) {
    if (endBar) {
      this.gantt.isPlaying = false;
      this.endBar = endBar;
      this.videoChartService.changeIsPlay(false);
      this.barSelected = barSelected;
      this.videoChartService.setBarSelected(this.barSelected);
      return;
    }

    if (this.isAnySceneFilterActive(endBarTime)) {
      // if has any scene filtered active
      // do nothing
      return;
    }
    let nextSceneTime;
    if (this.sceneFiltered.length === 0 || this.tagFiltered.length === 0) {
      nextSceneTime = this.getNextScene(endBarTime, 1);
    } else {
      nextSceneTime = this.getNextSceneFiltered(endBarTime, 1);
    }
    if (endBarTime !== nextSceneTime && this.isPlay && !this.dragging) {
      // Seek only playing
      this.nextSceneTimeOutIds.push(
        setTimeout(() => {
          this.videoChartService.seek(true, nextSceneTime);
          this.videoChartService.seekEnd();
        }, 1000 / this.speed)
      );
    }
  }

  isAnySceneFilterActive(now: number) {
    // Find a scene filtered active when
    // another scene filtered end

    // Get scene after now
    const length = this.tasksFormated.length;
    for (let i = 0; i < length; ++i) {
      const task = this.tasksFormated[i];
      if (
        this.sceneFiltered.indexOf(task.taskNameDisplay) !== -1 && // task filtered
        task.startDate <= now && // and
        task.endDate > now // active
      ) {
        return true;
      }
      if (task.startDate > now) {
        return false;
      }
    }
    return false;
  }

  onBarContextMenuCallback(barInfo: any, index: number, position: any, timeClick: any) {
    this.isExistedSceneBar = !(!!barInfo.isCoverSceneBar); // Case: right clicked a existed or a empty space  on this scene
    // Position of fake hidden fake div element
    this.contextMenuPosition.x = position.x + 'px';
    this.contextMenuPosition.y = position.y + 'px';
    const data = { barInfo, index, timeClick, xmlId: -1 };
    this.contextMenu.menuData = { data };
    if (this.isEditXML) {
      if (this.xmlId > -1) {
        data.xmlId = this.xmlId;
        this.contextMenu.openMenu();
      }
    } else {
      this.contextMenu.openMenu();
    }

  }

  handleDeleteSceneBarContextMenu(objSceneBar: any) {
    if (objSceneBar !== '') {
      const param = {
        type: 'confirm',
        title: 'CONFIRM',
        message: messageConstant.SCENE_BAR.CONFIRM_DELETE
      };
      this.subscriptions.push(this.dialogService.confirm(param).subscribe(result => {
        if (result) {
          this.videoEditXMLService.onDeleteSceneBar(+objSceneBar.barInfo.barId);
        }
      }));
    }
  }

  handleAddCommentContextMenu(data: any) {
    // Data come from gantt
    // Format defined like data vfj ariable in onBarContextMenuCallback function

    // Reuse handleCommentClick function to filt bar in chart and return barSelected
    this.barSelected = this.gantt.handleFilterBarContextMenu(data.barInfo, data.index);

    // Reset barselected
    this.videoChartService.setBarSelected(this.barSelected);

    // Raise event to focus input to add comment
    // Stop video
    this.videoChartCommentService.addCommentContextMenu.next(data);

    // Seek chart to right click position
    setTimeout(() => {
      this.videoChartService.seek(true, data.timeClick);
      this.videoChartService.seekEnd();
    }, 100);
  }

  getNextScene(now: number, key: number, startIndex = 0) {
    const length = this.tasksFormated.length;
    if (key === 1) {
      // Get scene after now
      for (let i = startIndex; i < length; ++i) {
        if (
          this.tasksFormated[i].startDate > now &&
          (this.sceneFiltered.length === 0 || this.sceneFiltered.indexOf(this.tasksFormated[i].taskNameDisplay) !== -1)
        ) {
          return this.tasksFormated[i].startDate;
        }
      }
    } else if (key === -1) {
      // Get scene before now
      for (let i = length - 1; i >= 0; --i) {
        if (
          this.tasksFormated[i].startDate < now &&
          (this.sceneFiltered.length === 0 || this.sceneFiltered.indexOf(this.tasksFormated[i].taskNameDisplay) !== -1)
        ) {
          return this.tasksFormated[i].startDate;
        }
      }
    }
    return now;
  }

  getNextSceneFiltered(now: number, key = 0) {
    const length = this.tasksFormated.length;
    switch (key) {
      case 0:
        // Get filteredscene before or after now
        for (let i = 0; i < length; ++i) {
          if (
            (this.sceneFiltered.length === 0 ||
              this.sceneFiltered.indexOf(this.tasksFormated[i].taskNameDisplay) !== -1) &&
            (this.tagFiltered.length === 0 || this.isHasADescriptionInTagFiltered(this.tasksFormated[i].description))
          ) {
            return this.tasksFormated[i].startDate;
          }
        }
        break;
      case 1:
        // Get filteredscene after now
        for (let i = 0; i < length; ++i) {
          if (
            this.tasksFormated[i].startDate > now &&
            (this.sceneFiltered.length === 0 ||
              this.sceneFiltered.indexOf(this.tasksFormated[i].taskNameDisplay) !== -1) &&
            (this.tagFiltered.length === 0 || this.isHasADescriptionInTagFiltered(this.tasksFormated[i].description))
          ) {
            return this.tasksFormated[i].startDate;
          }
        }
        break;
      case -1:
        // Get filteredscene before or after now
        for (let i = length - 1; i >= 0; --i) {
          if (
            this.tasksFormated[i].startDate < now &&
            (this.sceneFiltered.length === 0 ||
              this.sceneFiltered.indexOf(this.tasksFormated[i].taskNameDisplay) !== -1) &&
            (this.tagFiltered.length === 0 || this.isHasADescriptionInTagFiltered(this.tasksFormated[i].description))
          ) {
            return this.tasksFormated[i].startDate;
          }
        }
        break;
    }
    return now;
  }

  isHasADescriptionInTagFiltered(descriptions: string[]) {
    for (const description of descriptions) {
      if (this.tagFiltered.indexOf(description) !== -1) {
        return true;
      }
    }
    return false;
  }

  ngOnDestroy() {
    if (!!this.gantt) {
      this.gantt.observableScalingLeftRightObjList.unsubscribe();
      this.gantt.observableNumberCurrentTimeChoosing.unsubscribe();
      this.gantt.removeAll();
      this.gantt = undefined;
    }
    this.videoChartCommentService.timeCommentClick.next({ timeInVideo: -1, sceneName: '' });
    this.subscriptions.forEach(s => s.unsubscribe());
    this.videoEditXMLService.rspOnSaveNewSceneBarToExistedScene = new BehaviorSubject<SceneBarParams>(null);
    this.videoEditXMLService.rspOnSaveOldSceneBarToExistedScene = new BehaviorSubject<SceneBarParams>(null);
    this.videoEditXMLService.rspOnSaveNewScene = new BehaviorSubject<SceneParams>(null);
    this.videoEditXMLService.rspOnSaveOldScene = new BehaviorSubject<SceneParams>(null);
    this.videoEditXMLService.rspOnSaveNewSceneBarsToExistedScene = new BehaviorSubject<SceneBarParams[]>(null);
    this.videoEditXMLService.removeAllRecordingSceneBars = new BehaviorSubject<boolean>(null);
    this.videoChartService.duration = new BehaviorSubject<any>(null);
  }

  setMileStoneData(time: number) {
    this.mileStoneDate = time;
  }

  changeCurrentTime(time: any) {
    const mileStoneDate = time ? time : this.mileStoneDate;
    this.videoChartService.seek(true, mileStoneDate);
  }

  filterSceneToEditXML(sceneName: string): any[] {
    const result = [];
    if (sceneName) {
      let index = 0;
      const temps = this.tasksFormated.filter(item => item.taskNameDisplay === sceneName);
      this.videoEditXMLService.sceneNameAddNewFromLeftSide = sceneName;
      result.push(
        {
          isCoverSceneBar: true,
          id: 'bar-' + 0,
          taskName: '_' + this.videoEditXMLService.xmlId + '-' + sceneName,
          taskNameDisplay: sceneName,
          objPreLeftRight: {
            preLeft: -1,
            subRight: -1
          },
          leftPathId: 'pathLeft-startStop-' + 0,
          rightPathId: 'pathRight-startStop-' + 0,
          maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
          widthSVG: this.videoEditXMLService.widthSVG,
          description: [],
          endDate: this.videoEditXMLService.maxVideoDuration,
          startDate: 0,
          color: 'rgb(255,255,255)',
          select: false
        });
      this.videoEditXMLService.objSceneClicked.sceneBars = [];
      if (!this.videoEditXMLService.isAddNewScene) {
        temps.forEach(item => {
          const objSceneBar = new SceneBar();
          objSceneBar.id = item.barId;
          objSceneBar.startTime = item.startDate;
          objSceneBar.endTime = item.endDate;
          objSceneBar.preLeft = (index > 0) ? temps[index - 1].endDate : -1;
          objSceneBar.subRight = (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration;
          objSceneBar.isOriginSceneBar = true;
          objSceneBar.tags = item.description;
          this.videoEditXMLService.objSceneClicked.sceneBars.push(objSceneBar);
          const obj = {
            barId: item.barId,
            id: 'bar-' + (index + 1),
            taskName: item.taskName,
            taskNameDisplay: item.taskNameDisplay,
            objPreLeftRight: {
              preLeft: (index > 0) ? temps[index - 1].endDate : -1,
              subRight: (index < temps.length - 1) ? temps[index + 1].startDate : this.videoEditXMLService.maxVideoDuration
            },
            leftPathId: 'pathLeft-startStop-' + (index + 1),
            rightPathId: 'pathRight-startStop-' + (index + 1),
            maxTimeSliderScale: this.videoEditXMLService.maxTimeSliderScale,
            widthSVG: this.videoEditXMLService.widthSVG,
            description: item.description,
            endDate: item.endDate,
            startDate: item.startDate,
            color: item.color,
            select: item.select
          };
          result.push(obj);
          ++index;
        });
      }
      return result;
    }
    return result;
  }

  buildGanttNewSceneScalingTime(tasksFormated = [], isAllRemoved = true) {
    this.tasksFormated = tasksFormated;
    this.videoEditXMLService.isEditXMLGantt = true;
    this.buildGantt(true, isAllRemoved);

    this.subscriptions.push(this.gantt.obsSceneBarScaling.subscribe((status: boolean) => {
      if (status && this.videoEditXMLService.objSceneBarClicked.id > -1) {
        this.videoEditXMLService.onScalingSceneBar(this.gantt.sceneBarScaling);
      }
    }));
  }

  onChangeScalingTime(event: any) {
    if (event) {
      this.gantt.changeLeftRightScene(event);
      // Saving start, stop time after modify
      for (const item of this.tasksFormated) {
        if (item.idNewScene === event.idNewScene) {
          item.startDate = event.startAt;
          item.endDate = event.stopAt;
          break;
        }
      }
      // Update start time, stop time for Edit scene right pane
      const objNewSceneDecorate = {
        actionType: EDIT_XML_ACTION.CLICK_SCENE_BAR,
        id: event.idNewScene,
        endDate: event.stopAt,
        startDate: event.startAt,
        color: DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT
      };
      // this.videoEditXMLService.observableSceneBarChoosing.next(objNewSceneDecorate);
    }
  }

  onRemoveNewSceneScalingTimeBySceneId(sceneId: string) {
    const noId = sceneId.split('-')[1];
    const idGroup = '#groupBar-' + noId;
    if (this.gantt.removeNewSceneById(idGroup)) {
      const index = this.tasksFormated.findIndex(item => item.idNewScene === sceneId);
      if (index > -1)
        this.tasksFormated.splice(index, 1);
    }
  }

  onHandleLeftRightNewSceneGanttChart(event) {
    this.gantt.onHandleLeftRightSBGanttChart(event);
  }

  onHandlePreLeftSubRightNewSceneGanttChart(event) {
    const index = this.preLeftRightNewSceneList.findIndex(item => item.id === event.id);
    if (index > -1)
      this.preLeftRightNewSceneList[index] = event;
    else
      this.preLeftRightNewSceneList.push(event);

  }

  onHandleIsScalingLeftRighNewSceneGanttChart(event) {
    this.gantt.onSaveListScalingLeftRightNewScene(event);
  }

  onUpdateNewSceneTemp(data: any) {
    if (!!this.gantt) {
      this.gantt.onUpdateNewSceneTemp(data);
    }
  }

  onBarClickEditXML(barSelected: any) {
    if (!this.videoEditXMLService.isEditingSceneBar) {
      this.barSelected = barSelected;
      if (!!this.barSelected.id) {
        this.videoEditXMLService.onClickedSceneBar(barSelected.barId);
      } else {
        this.videoEditXMLService.objSceneBarClicked.id = -1;
        this.videoEditXMLService.onClickedSceneBar(barSelected.barId);
        this.videoEditXMLService.setEditSceneContent.next(this.videoEditXMLService.objSceneBarClicked);
      }
      this.videoChartService.setBarSelected(this.barSelected);
      const time = this.gantt.getTimeDomainMiddle();
      this.videoChartService.seek(true, time);
      this.videoChartService.seekEnd();
      this.currentTimeChange.emit(time);
    }
    //
    else {
      const param = {
        type: 'confirm',
        title: 'CONFIRM',
        message: messageConstant.SCENE_BAR.CONFIRM_NOT_SAVE
      };
      this.subscriptions.push(this.dialogService.confirm(param).subscribe(result => {
        if (result) {
          this.videoEditXMLService.obsRevertSceneBar.next(true);
          this.videoEditXMLService.removeAllRecordingSceneBars.next(true);
          setTimeout(() => {
            this.videoEditXMLService.isEditingSceneBar = false;
            this.gantt.objEditingSceneBar.isEditing = false;
            this.gantt.handleBarClickEditXML(this.gantt.objEditingSceneBar.data, this.gantt.objEditingSceneBar.index);
          }, 200);
        }
      }));
    }
  }

  onDragEndCallbackEditXML(newStartTimeToMiddleRange?: number) {
    this.dragging = false;
    if (!this.isPlay && this.flagChangePlayInDrag) {
      this.videoChartService.changeIsPlay(true);
      this.flagChangePlayInDrag = false;
    }
    this.currentTimeChange.emit(this.previousDragTime);
  }

  handleAddNewSceneBarBarContextMenu(data: any) {
    if (this.videoEditXMLService.isAddNewScene) {
      const param = {
        type: 'info',
        title: 'INFORM',
        message: messageConstant.XML_EDITING.MUST_SAVE_SCENE
      };
      this.subscriptions.push(this.dialogService.info(param).subscribe(response => {
        if (response) {
        }
      }));
    } else {
      const sceneBarParams = new SceneBarParams();
      sceneBarParams.xml_id = this.videoEditXMLService.xmlId;
      sceneBarParams.scene_bar_name = this.videoEditXMLService.setSceneClicked.value.sceneName;
      sceneBarParams.scene_bar_color = ColorUtil.hexToRgb(this.videoEditXMLService.setSceneClicked.value.sceneColor);
      sceneBarParams.scene_bar_end = (data.timeClick + 5).toString();
      sceneBarParams.scene_bar_start = (data.timeClick).toString();
      sceneBarParams.labels = [];
      this.videoEditXMLService.onSaveNewSceneBarToExistedScene(sceneBarParams);

      // this.syncGanttChartToTimeline(newSceneBar.id);
      // this.videoEditXMLService.addNewSingleSceneBar();
    }

  }

  syncGanttChartToTimeline(newSceneBarId: number) {
    this.videoEditXMLService.obsSyncGanttChartToTimeline.next(newSceneBarId);
  }
  // End Scaling, add new scene
  handleZoom(kZoom: number) {
    if (this.gantt) {
      this.gantt.changeKZoom(kZoom);
      const slidingStateBackup = this.gantt.getIsSliding();
      this.gantt.setIsSliding(true);
      this.gantt.redraw(false, this.gantt.getTimeDomainMiddle());
      this.gantt.setIsSliding(slidingStateBackup);
      this.ganttLineService.ganttZoom.next(kZoom);
    }
  }
}
