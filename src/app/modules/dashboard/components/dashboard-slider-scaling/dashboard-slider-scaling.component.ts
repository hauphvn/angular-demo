import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import * as d3 from 'd3';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { DateUtil } from '@app/shared/utils/date';
import { VideoEditXmlService } from '@app/core/services/server-services/video-edit-xml.service';
import { DASHBOARD_EDIT_XML, EDIT_XML_ACTION, messageConstant } from '@app/configs/app-constants';
import { ActionStatus, SceneBar, SceneBarParams } from '@app/shared/models/editXMLDataModel';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { D } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-dashboard-slider-scaling',
  templateUrl: './dashboard-slider-scaling.component.html',
  styleUrls: ['./dashboard-slider-scaling.component.scss']
})
export class DashboardSliderScalingComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() maxTimeSliderScale = 0;
  @Input() currentTimeSliderScale = 0;
  @Input() value = 5;
  @Input() objResult: any;
  @Output() outHandleOnSave: EventEmitter<any> = new EventEmitter<any>();
  @Output() outScalingTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() outIdRemovingNewScene: EventEmitter<string> = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() outEventHandleNewSceneGanttChart = new EventEmitter<any>();
  @Output() outPreLeftSubRightScene = new EventEmitter<any>();
  @Output() outEventIsScalingLeftRight = new EventEmitter<any>();

  subscriptions: Subscription[] = [];
  btnUndoNewScene: HTMLElement;
  enableUndoNewScene = false;
  listStartStop = [];
  maxProgress = 0;
  startAtX = 0;
  svg: any;
  widthSVG = 0;
  onPlaying = false;
  defaultSceneName = 'New Scene';
  idRemovingNewScene = '';
  isClickSave = false;
  slider: HTMLElement;
  widthSlider = 0;
  leftTooltip = 50;
  mousemove: Observable<Event>;
  mouseover: Observable<Event>;
  mouseleave: Observable<Event>;
  mouseup: Observable<Event>;
  mousedown: Observable<Event>;
  valueString = '';
  isMouseDown = false;
  isHover = false;
  addedObjPreLeftRight = false;
  dragCallback;

  constructor(
    private dateUtil: DateUtil,
    private videoEditXMLService: VideoEditXmlService,
    private dialogService: DialogService
  ) {
  }

  ngOnInit() {
    this.widthSVG = document.getElementById('dashboard-slider-scaling').offsetWidth;
    this.svg = d3.select('#mySVG');
    this.maxProgress = this.maxTimeSliderScale;
    this.btnUndoNewScene = document.getElementById('btnUndoNewScene');
    this.videoEditXMLService.widthSVG = this.widthSVG;

    this.subscriptions.push(this.videoEditXMLService.obsRevertSceneBar.subscribe(status => {
      if (status) {
        this.onRevertSceneBarTimeline(this.videoEditXMLService.objSceneBarClicked);
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.obsActionStatus.subscribe((actionStatus: ActionStatus) => {
      if (!!actionStatus && actionStatus.letUpdateUIScene) {
        this.onClearingScalingUI();
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.obsSyncGanttChartToTimeline.subscribe((newSceneBarId) => {
      if (newSceneBarId > -1) {
        this.syncGanttChartToTimeline(newSceneBarId);
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.obsSyncGanttChartRecordsToTimeline.subscribe((newSceneBarId) => {
      if (newSceneBarId) {
        this.syncGanttChartRecordsToTimeline(newSceneBarId);
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.obsResetDefaultTimeline.subscribe((data: boolean) => {
      if (data) {
        this.onRemoveAll();
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.setSceneClicked.subscribe(data => {
      if (data) {
        this.listStartStop = [];
      }
    }));

    this.subscriptions.push(this.videoEditXMLService.obsClickedSceneBar.subscribe(status => {
      if (status) {
        this.onClickedSceneBarFromGanttChart(this.videoEditXMLService.objSceneBarClicked.id);
      }
    }));


    this.subscriptions.push(this.videoEditXMLService.obsScalingSceneBar.subscribe(sceneBarScaling => {
      if (sceneBarScaling) {
        this.onScalingSceneBarFromGanttChart();
      }
    }));
  }

  ngAfterViewInit() {
    this.slider = document.getElementById('dashboard-slider-scaling-time');
    const boundX = this.slider.getBoundingClientRect().left;
    this.widthSlider = this.slider.offsetWidth;
    this.mousemove = fromEvent(this.slider, 'mousemove');
    this.mousemove.subscribe((e: MouseEvent) => {
      this.leftTooltip = e.clientX - boundX;
      let temp = (this.maxTimeSliderScale * this.leftTooltip) / this.widthSlider;
      for (const item of this.listStartStop) {
        if (temp >= item.startAt && temp <= item.stopAt) {
          temp = item.stopAt;
          break;
        }
      }
      this.valueString = this.dateUtil.secondsToTime(temp);
      if (this.isMouseDown) {
        this.value = temp;
        this.valueChange.emit(this.value);
      }
    });

    this.mouseover = fromEvent(this.slider, 'mouseover');
    this.mouseover.subscribe((e: MouseEvent) => {
      this.isHover = true;
    });

    this.mouseleave = fromEvent(this.slider, 'mouseleave');
    this.mouseleave.subscribe((e: MouseEvent) => {
      this.isHover = false;
      this.isMouseDown = false;
    });

    this.mouseup = fromEvent(this.slider, 'mouseup');
    this.mouseup.subscribe((e: MouseEvent) => {
      this.isMouseDown = false;
    });

    this.mousedown = fromEvent(this.slider, 'mousedown');
    this.mousedown.subscribe((e: MouseEvent) => {
      this.isMouseDown = true;
      let temp = (this.maxTimeSliderScale * this.leftTooltip) / this.widthSlider;
      for (const item of this.listStartStop) {
        if (temp >= item.startAt && temp <= item.stopAt) {
          temp = item.stopAt;
          break;
        }
      }
      this.valueString = this.dateUtil.secondsToTime(temp);
      if (this.isMouseDown) {
        this.value = temp;
        this.valueChange.emit(this.value);
      }
    });
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  onStart(valueProgress: number) {
    if (this.currentTimeSliderScale > 0 || valueProgress) {
      this.onPlaying = !this.onPlaying;
      this.startAtX = valueProgress;
    }
  }

  onStop(valueStopAt: number) {
    if (this.currentTimeSliderScale > 0) {
      this.onPlaying = !this.onPlaying;
    }
    this.startAtX = 0;
  }

  /***
   * Khi click thanh video đã chọn thì:
   *  - Video chạy đến điểm cuối của thanh đó.(cả trường hợp đã lưu và chưa lưu)
   *  - Enable 2 đầu của scene bar gantt chart tương ứng
   */
  onClickNewTimeBar = (idCurrent: string, sizeList: number): void => {
    // Checking previous modify rect
    this.checkingPreviousModifyRect(idCurrent);
    // showing button deleting a special new scene
    if (this.btnUndoNewScene) {
      this.btnUndoNewScene.classList.remove('disable-icon');
      this.btnUndoNewScene.classList.add('enable-icon');
      this.enableUndoNewScene = true;
      this.idRemovingNewScene = idCurrent;
    }
    // remove all left-right path svg
    const myPath = d3.select('#mySVG').selectAll('.pathLeftRight');
    if (myPath) {
      myPath.remove();
      for (const item of this.listStartStop) {
        item.hasLeft = false;
        item.hasRight = false;
      }
    }
    // choosing a new scene to modifying
    let objGet;
    for (const item of this.listStartStop) {
      if (item.id === idCurrent) {
        objGet = item;
        break;
      }
    }
    if (objGet) {
      // tslint:disable-next-line:no-shadowed-variable
      let objPreLeftRight = null;
      let newWidth = 0;
      let isDraggedLeft = false;
      let isDraggedRight = false;
      let xCoordinate = 0;
      if (!objGet.hasLeft) {
        const leftPathId = 'pathLeft-' + objGet.id;
        const leftPath = d3.select('#' + objGet.id).append('path')
          .attr('data-modify', false)
          .attr('id', leftPathId)
          .attr('class', 'pathLeftRight')
          .attr('d', `M ${objGet.xRectLeft} 0 V 9.5 Z`)
          .attr('stroke-width', '4')
          .attr('stroke', 'white')
          .style('cursor', 'col-resize');

        // Creating left, right rect of new scene gantt chart
        // Get front left of current rect to preventing drawing over
        objPreLeftRight = this.getPreLeftSubRightScene(objGet.id);
        this.outEventHandleNewSceneGanttChart.emit(
          {
            id: objGet.id,
            startDate: objGet.startAt,
            stopDate: objGet.stopAt,
            leftPathId: 'pathLeft-' + objGet.id,
            rightPathId: 'pathRight-' + objGet.id,
            maxTimeSliderScale: this.maxTimeSliderScale,
            widthSVG: this.widthSVG,
            isScaling: false,
            objPreLeftRight
          }
        );

        leftPath
          .call(d3.drag()
            .on('start', () => {
              this.valueChange.emit(objGet.startAt); // Set current time slide at position of scaling
              isDraggedLeft = true;
              xCoordinate = 0;
              const scaleTimeSVG = d3.select('body');
              if (scaleTimeSVG) {
                scaleTimeSVG.style('cursor', 'col-resize');
              }
              // Get front left of current rect to preventing drawing over
              objPreLeftRight = this.getPreLeftSubRightScene(objGet.id);
              // Check value is modified by scene bar chart
              const objTemp = this.videoEditXMLService.getPreviousLeftRightBeforeScaling(objGet.id);
              if (objTemp) {
                objPreLeftRight = objTemp;
              }
            })
            .on('drag', () => {
              xCoordinate += d3.event.dx;
              if (xCoordinate > objGet.width) {
                xCoordinate = objGet.width;
              }
              newWidth = objGet.width - (xCoordinate);
              const xLeft = ((objGet.xRectLeft + xCoordinate) * this.maxTimeSliderScale) / this.widthSVG;
              if (objPreLeftRight) {
                if (xLeft < objPreLeftRight.preLeft) {
                  return;
                }
              }
              d3.select('#pathLeft-' + idCurrent)
                .attr('data-modify', false)
                // .attr('transform', 'translate(' + xCoordinate + ',0)')
                .attr('d', `M ${objGet.xRectLeft + xCoordinate} 0 V 9.5 Z`);
              d3.select('#rect-' + idCurrent)
                .attr('data-modify', false)
                .attr('x', objGet.xRectLeft + xCoordinate)
                .attr('width', newWidth);
              objGet.xShiftLeft = xCoordinate;
              // Emit to modifying bar new scene on gantt chart
              this.outScalingTime.emit({
                idNewScene: idCurrent,
                pathSide: 'left',
                startAt: xLeft,
                stopAt: objGet.stopAt,
                width: newWidth
              });
              this.valueChange.emit(xLeft); // Set current time slide at position of scaling
            })
            .on('end', () => {
              if (isDraggedLeft) {
                for (const item of this.listStartStop) {
                  if (idCurrent === item.id) {
                    item.hasLeft = true;
                    item.width = newWidth;
                    item.startAt = ((objGet.xRectLeft + xCoordinate) * this.maxTimeSliderScale) / this.widthSVG;
                    item.xRectLeft = objGet.xRectLeft + xCoordinate;
                    item.xShiftLeft = xCoordinate;
                    break;
                  }
                }
                isDraggedLeft = false;
              }
              const scaleTimeSVG = d3.select('body');
              if (scaleTimeSVG) {
                scaleTimeSVG.style('cursor', 'auto');
              }
              // Updating left-right path of objPreLeftRight after scaling time
              if (sizeList >= 1) {
                this.outEventIsScalingLeftRight.emit(
                  {
                    id: 'startStop-' + (sizeList - 1),
                    isScaling: true,
                    objPreLeftRight: this.getPreLeftSubRightScene('startStop-' + (sizeList - 1))
                  }
                );
              }
            }));
      }
      if (!objGet.hasRight) {
        const rightPathId = 'pathRight-' + objGet.id;
        d3.select('#' + objGet.id).append('path')
          .attr('data-modify', false)
          .attr('id', rightPathId)
          .attr('class', 'pathLeftRight')
          .attr('d', `M ${objGet.xRectRight} 0 V 9.5 Z`)
          .attr('stroke-width', '4')
          .attr('stroke', 'white')
          .style('cursor', 'col-resize')
          .call(d3.drag()
            .on('start', () => {
              this.valueChange.emit(objGet.stopAt); // Set current time slide at position of scaling
              isDraggedRight = true;
              xCoordinate = 0;
              const scaleTimeSVG = d3.select('body');
              if (scaleTimeSVG) {
                scaleTimeSVG.style('cursor', 'col-resize');
              }
              objPreLeftRight = this.getPreLeftSubRightScene(objGet.id);
              // Check value is modified by scene bar chart
              const objTemp = this.videoEditXMLService.getPreviousLeftRightBeforeScaling(objGet.id);
              if (objTemp) {
                objPreLeftRight = objTemp;
              }
            })
            .on('drag', () => {
              xCoordinate += d3.event.dx;
              if (-xCoordinate >= (objGet.width)) {
                xCoordinate = -(objGet.width);
              }
              newWidth = objGet.width + (xCoordinate);
              const xRight = ((objGet.xRectRight + xCoordinate) * this.maxTimeSliderScale) / this.widthSVG;
              if (objPreLeftRight && objPreLeftRight.subRight > 0) {
                if (xRight > objPreLeftRight.subRight) {
                  return;
                }
              }
              d3.select('#pathRight-' + idCurrent)
                .attr('data-modify', false)
                .attr('d', `M ${objGet.xRectRight + xCoordinate} 0 V 9.5 Z`);
              d3.select('#rect-' + idCurrent)
                .attr('data-modify', false)
                .attr('x', objGet.xRectLeft)
                .attr('width', newWidth);
              objGet.xShiftRight = xCoordinate;
              // Sync scene bar and scene on duration video time
              this.outScalingTime.emit({
                idNewScene: idCurrent,
                pathSide: 'right',
                startAt: objGet.startAt,
                stopAt: xRight,
                width: newWidth
              });
              // End Sync scene...
              this.valueChange.emit(xRight); // Set current time slide at position of scaling
            })
            .on('end', () => {
              if (isDraggedRight) {
                for (const item of this.listStartStop) {
                  if (idCurrent === item.id) {
                    item.hasLeft = true;
                    item.width = newWidth;
                    item.stopAt = ((objGet.xRectRight + xCoordinate) * this.maxTimeSliderScale) / this.widthSVG;
                    item.xRectRight = objGet.xRectRight + xCoordinate;
                    item.xShiftRight = xCoordinate;
                    break;
                  }
                }
                isDraggedRight = false;
              }
              const scaleTimeSVG = d3.select('body');
              if (scaleTimeSVG) {
                scaleTimeSVG.style('cursor', 'auto');
              }
              // Updating left-right path of objPreLeftRight after scaling time
              if (sizeList + 1 < this.listStartStop.length) {
                this.outEventIsScalingLeftRight.emit(
                  {
                    id: 'startStop-' + (sizeList + 1),
                    isScaling: true,
                    objPreLeftRight: this.getPreLeftSubRightScene('startStop-' + (sizeList + 1))
                  }
                );
              }
            }));
      }
    }
  }

  onSave() {
    if (!!this.videoEditXMLService.obsNewScene.value) {
      if (this.videoEditXMLService.obsNewScene.value.placeEditingOn === EDIT_XML_ACTION.EDITING_ON_EXIST_SCENE) {
        this.videoEditXMLService.onSaveDraftToExistedScene();
      }
      //
      else if (this.videoEditXMLService.obsNewScene.value.placeEditingOn === EDIT_XML_ACTION.EDITING_ON_NEW_SCENE) {
        // if (this.listStartStop.length > 0) {
        //   // Updating rects was modified
        //   const len = this.listStartStop.length;
        //   for (let i = 0; i < len; i++) {
        //     if (this.listStartStop[i].id === ('startStop-' + i)) {
        //       const rect = d3.select('#rect-startStop-' + i);
        //       const pathLeft = d3.select('#pathLeft-startStop-' + i);
        //       const pathRight = d3.select('#pathRight-startStop-' + i);
        //       if (rect.node().dataset.modify === 'true') {
        //         this.listStartStop[i].width = rect.node().getBoundingClientRect().width;
        //         this.listStartStop[i].xRectLeft = rect.node().getBoundingClientRect().x;
        //         this.listStartStop[i].xRectRight = rect.node().getBoundingClientRect().x + this.listStartStop[i].width;
        //         this.listStartStop[i].startAt = (this.listStartStop[i].xRectLeft * this.maxTimeSliderScale) / this.widthSVG;
        //         this.listStartStop[i].stopAt = ((this.listStartStop[i].xRectLeft + this.listStartStop[i].width)
        //           * this.maxTimeSliderScale) / this.widthSVG;
        //         rect.attr('data-modify', false);
        //       }
        //       pathLeft.remove();
        //       pathRight.remove();
        //     }
        //   }
        //   this.isClickSave = true;
        //   const obj = {
        //     newSceneName: this.defaultSceneName + Math.random(),
        //     listStartStop: this.listStartStop
        //   };
        //   this.listStartStop.forEach(item => {
        //     item.objPreLeftRight = this.getPreLeftSubRightScene(item.id);
        //   });
        //   this.outHandleOnSave.emit(obj);
        //   this.videoEditXMLService.sceneName = obj.newSceneName;
        //   this.videoEditXMLService.onSaveDraft(obj);
        // }
      }
    }
  }

  onRemoveAll() {
    if (this.listStartStop.length > 0) {
      this.isClickSave = false;
      for (const item of this.listStartStop) {
        d3.select('#' + item.id).remove();
        this.onRemovingTimeBarDurationById(item.id);
        this.outIdRemovingNewScene.emit(item.id);
      }
      d3.selectAll(".groupBarTimeline").remove();
      this.listStartStop = [];
      this.enableUndoNewScene = false;
    }
  }

  onUndoNewScene() {
    if (this.enableUndoNewScene) {
      if (this.onRemovingTimeBarDurationById(this.idRemovingNewScene)) {
        // Removing scene bar gantt chart
        this.outIdRemovingNewScene.emit(this.idRemovingNewScene);

        this.enableUndoNewScene = false;
        this.btnUndoNewScene.classList.remove('enable-icon');
        this.btnUndoNewScene.classList.add('disable-icon');
        const indexRemove = this.listStartStop.findIndex(item => item.id === this.idRemovingNewScene);
        this.listStartStop.splice(indexRemove, 1);
      }
    }
  }

  onHandleNewSceneGanttChart(noId: string) {
  }

  checkingPreviousModifyRect(id: string) {
    if (id !== '' && id.includes('-')) {
      const noId = id.split('-')[1];
      const rect = d3.select('#rect-startStop-' + noId);
      if (rect.node().dataset.modify === 'true') {
        for (const item of this.listStartStop) {
          if (item.id === id) {
            item.width = rect.node().getBoundingClientRect().width;
            item.xRectLeft = rect.node().getBoundingClientRect().x;
            item.xRectRight = rect.node().getBoundingClientRect().x + item.width;
            item.startAt = (item.xRectLeft * this.maxTimeSliderScale) / this.widthSVG;
            item.stopAt = ((item.xRectLeft + item.width) * this.maxTimeSliderScale) / this.widthSVG;
            rect.attr('data-modify', false);
            break;
          }
        }
      }
    }
  }

  syncGanttChartToTimeline(sceneBarId: number) {
    const index = this.videoEditXMLService.objSceneClicked.sceneBars.findIndex(item => +item.id === +sceneBarId);
    if (index >= -1) {
      const sceneBar = this.videoEditXMLService.objSceneClicked.sceneBars[index];
      const sizeList = this.listStartStop.length + 1;
      const width = ((sceneBar.endTime - sceneBar.startTime) / this.maxTimeSliderScale) * this.widthSVG;
      const idCurrent = 'barTimeline-' + sceneBarId;
      const xRectLeft = (sceneBar.startTime / this.maxTimeSliderScale) * this.widthSVG;
      const xRectRight = (sceneBar.endTime / this.maxTimeSliderScale) * this.widthSVG;
      const group = d3.select('#myGroup')
        .append('g')
        .attr('class', 'groupBarTimeline')
        .attr('id', 'groupBarTimeline-' + sceneBarId);
      const rects = group
        .append('rect')
        .attr('data-modify', false)
        .attr('id', 'barTimeline-' + sceneBarId)
        .attr('class', 'startStopClass')
        .attr('x', xRectLeft)
        .attr('width', width)
        .attr('height', 10)
        .attr('fill', DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT);

      rects.on('click', () => { this.onClickedSceneBarTimeline(sceneBarId); });

      this.listStartStop.push({
        id: idCurrent,
        index: sizeList,
        startAt: sceneBar.startTime,
        stopAt: sceneBar.endTime,
        xRectLeft,
        xRectRight,
        xShiftLeft: 0,
        xShiftRight: 0,
        width,
        hasLeft: false,
        hasRight: false,
        objPreLeftRight: {
          preLeft: -1,
          subRight: -1
        },
        leftPathId: 'pathLeft-startStop-' + sizeList,
        rightPathId: 'pathRight-startStop-' + sizeList,
        maxTimeSliderScale: this.maxTimeSliderScale,
        widthSVG: this.widthSVG
      });
    }
  }

  syncGanttChartRecordsToTimeline(sceneBarId: string) {
    const index = this.videoEditXMLService.objSceneClicked.recordSceneBars.findIndex(item => item.idRecord === sceneBarId);
    if (index >= -1) {
      const sceneBar = this.videoEditXMLService.objSceneClicked.recordSceneBars[index];
      const sizeList = this.listStartStop.length + 1;
      const width = ((sceneBar.endTime - sceneBar.startTime) / this.maxTimeSliderScale) * this.widthSVG;
      const idCurrent = 'barTimeline-' + sceneBarId;
      const xRectLeft = (sceneBar.startTime / this.maxTimeSliderScale) * this.widthSVG;
      const xRectRight = (sceneBar.endTime / this.maxTimeSliderScale) * this.widthSVG;
      const group = d3.select('#myGroup')
        .append('g')
        .attr('class', 'groupBarTimeline')
        .attr('id', 'groupBarTimeline-' + sceneBarId);
      const rects = group
        .append('rect')
        .attr('data-modify', false)
        .attr('id', 'barTimeline-' + sceneBarId)
        .attr('class', 'startStopClass')
        .attr('x', xRectLeft)
        .attr('width', width)
        .attr('height', 10)
        .attr('fill', DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT);


      this.listStartStop.push({
        id: idCurrent,
        index: sizeList,
        startAt: sceneBar.startTime,
        stopAt: sceneBar.endTime,
        xRectLeft,
        xRectRight,
        xShiftLeft: 0,
        xShiftRight: 0,
        width,
        hasLeft: false,
        hasRight: false,
        objPreLeftRight: {
          preLeft: -1,
          subRight: -1
        },
        leftPathId: 'pathLeft-startStop-' + sizeList,
        rightPathId: 'pathRight-startStop-' + sizeList,
        maxTimeSliderScale: this.maxTimeSliderScale,
        widthSVG: this.widthSVG
      });
    }
  }

  onClickedSceneBarFromGanttChart(sceneBarId: number) {
    const oldLeftRect = d3.select('rect#leftBarTimeline');
    const oldRightRect = d3.select('rect#rightBarTimeline');

    if (!!oldLeftRect) {
      oldLeftRect.remove();
    }
    if (!!oldRightRect) {
      oldRightRect.remove();
    }

    if (sceneBarId && sceneBarId > -1) {
      const xRectBefore = (this.videoEditXMLService.objSceneBarClicked.preLeft > -1)
        ? ((this.videoEditXMLService.objSceneBarClicked.preLeft / this.maxTimeSliderScale) * this.widthSVG) : -1;
      const xRectAfter = (this.videoEditXMLService.objSceneBarClicked.subRight > -1)
        ? ((this.videoEditXMLService.objSceneBarClicked.subRight / this.maxTimeSliderScale) * this.widthSVG) : -1;

      let xCoordinate = 0;
      let xRectLeft = 0;
      let xRectRight = 0;
      let width = 0;
      const scaleTimeSVG = d3.select('body');
      const groupRectTimeline = d3.select('g#groupBarTimeline-' + sceneBarId);
      const rectBarTimeline = d3.select('rect#barTimeline-' + sceneBarId);
      const leftRect = groupRectTimeline
        .append('rect')
        .attr('data-modify', false)
        .attr('id', 'leftBarTimeline');
      leftRect.attr('class', '')
        .attr('y', 0)
        // tslint:disable-next-line:max-line-length
        .attr('transform', `translate(${((this.videoEditXMLService.objSceneBarClicked.startTime / this.maxTimeSliderScale) * this.widthSVG)}, 0)`)
        .attr('height', 10)
        .attr('width', 4)
        .style('fill', 'black')
        .style('cursor', 'col-resize')
        .call(d3.drag()
          .on('start', () => {
            xCoordinate = 0;
            xRectLeft = (this.videoEditXMLService.objSceneBarScaling.startTime / this.maxTimeSliderScale) * this.widthSVG;
            xRectRight = (this.videoEditXMLService.objSceneBarScaling.endTime / this.maxTimeSliderScale) * this.widthSVG;
            width = ((this.videoEditXMLService.objSceneBarScaling.endTime
              - this.videoEditXMLService.objSceneBarScaling.startTime) / this.maxTimeSliderScale) * this.widthSVG;
            scaleTimeSVG.style('cursor', 'col-resize');
          })
          .on('drag', () => {
            xCoordinate += d3.event.dx;
            const rectScaling = xCoordinate + xRectLeft;
            if (rectScaling < 0) {
              xCoordinate = -xRectLeft;
            }
            if (rectScaling > xRectRight) {
              xCoordinate = xRectRight - xRectLeft;
            }
            if (rectScaling < xRectBefore) {
              xCoordinate = xRectBefore - xRectLeft;
            }
            leftRect.attr('transform', `translate(${xCoordinate + xRectLeft},0)`);
            rectBarTimeline.attr('x', xCoordinate + xRectLeft)
              .attr('width', width - xCoordinate);
            this.videoEditXMLService.objSceneBarScaling.startTime =
              ((xRectLeft + xCoordinate)
                * this.maxTimeSliderScale) / this.widthSVG;
            this.videoEditXMLService.obsScalingBarTimeline.next(true);

          })
          .on('end', () => {
            scaleTimeSVG.style('cursor', 'auto');
          }));

      const rightRect = groupRectTimeline
        .append('rect')
        .attr('data-modify', false)
        .attr('id', 'rightBarTimeline')
        .attr('class', '')
        .attr('y', 0)
        // tslint:disable-next-line:max-line-length
        .attr('transform', `translate(${((this.videoEditXMLService.objSceneBarClicked.endTime / this.maxTimeSliderScale) * this.widthSVG)}, 0)`)
        .attr('height', 10)
        .attr('width', 4)
        .style('fill', 'black')
        .style('cursor', 'col-resize')
        .call(d3.drag()
          .on('start', () => {
            xCoordinate = 0;
            xRectLeft = (this.videoEditXMLService.objSceneBarScaling.startTime / this.maxTimeSliderScale) * this.widthSVG;
            xRectRight = (this.videoEditXMLService.objSceneBarScaling.endTime / this.maxTimeSliderScale) * this.widthSVG;
            width = ((this.videoEditXMLService.objSceneBarScaling.endTime
              - this.videoEditXMLService.objSceneBarScaling.startTime) / this.maxTimeSliderScale) * this.widthSVG;
            scaleTimeSVG.style('cursor', 'col-resize');
          })
          .on('drag', () => {
            xCoordinate += d3.event.dx;
            const rectScaling = xCoordinate + xRectRight;
            if (rectScaling > this.widthSVG) {
              xCoordinate = this.widthSVG - xRectRight;
            }
            if (rectScaling < xRectLeft) {
              xCoordinate = xRectLeft - xRectRight;
            }
            if (xRectAfter > -1 && rectScaling > xRectAfter) {
              xCoordinate = xRectAfter - xRectRight;
            }
            rightRect.attr('transform', `translate(${xCoordinate + xRectRight},0)`);
            rectBarTimeline.attr('width', width + xCoordinate);
            this.videoEditXMLService.objSceneBarScaling.endTime =
              ((xRectRight + xCoordinate)
                * this.maxTimeSliderScale) / this.widthSVG;
            this.videoEditXMLService.obsScalingBarTimeline.next(true);
          })
          .on('end', () => {
            scaleTimeSVG.style('cursor', 'auto');
          }));
    }
  }

  onClickedSceneBarTimeline(sceneBarId: number) {
    // if (!this.videoEditXMLService.isEditingSceneBar)
    document.getElementById('bar-' + sceneBarId).dispatchEvent(new Event('click'));
    // else {
    // const param = {
    //   type: 'confirm',
    //   title: 'CONFIRM',
    //   message: messageConstant.SCENE_BAR.CONFIRM_NOT_SAVE
    // };
    // this.subscriptions.push(this.dialogService.confirm(param).subscribe(result => {
    //   if (result) {
    //     this.videoEditXMLService.isEditingSceneBar = false;
    //     this.videoEditXMLService.removeAllRecordingSceneBars.next(true);
    //     document.getElementById('bar-' + sceneBarId).dispatchEvent(new Event('click'));
    //   }
    // }));
    // }
  }


  onSaveNewSceneBar(params: SceneBarParams) {
    this.startAtX = 0;
    return this.videoEditXMLService.onSaveNewSceneBarToExistedScene(params);
  }

  onSaveNewSceneBars(params: SceneBarParams[]) {
    this.startAtX = 0;
    return this.videoEditXMLService.onSaveNewSceneBarsToExistedScene(params);
  }


  private onScalingSceneBarFromGanttChart() {
    const leftRect = d3.select('rect#leftBarTimeline');
    const rightRect = d3.select('rect#rightBarTimeline');
    const rectBarTimeline = d3.select('rect#barTimeline-' + this.videoEditXMLService.objSceneBarScaling.id);

    if (leftRect && rightRect && rectBarTimeline) {
      const xRectLeft = (this.videoEditXMLService.objSceneBarScaling.startTime / this.maxTimeSliderScale) * this.widthSVG;
      const xRectRight = (this.videoEditXMLService.objSceneBarScaling.endTime / this.maxTimeSliderScale) * this.widthSVG;
      const width = ((this.videoEditXMLService.objSceneBarScaling.endTime
        - this.videoEditXMLService.objSceneBarScaling.startTime) / this.maxTimeSliderScale) * this.widthSVG;

      leftRect.attr('transform', `translate(${xRectLeft}, 0)`);
      rightRect.attr('transform', `translate(${xRectRight}, 0)`);
      rectBarTimeline.attr('x', xRectLeft)
        .attr('width', width);
    }
  }

  private onClearingScalingUI() {
    const oldLeftRect = d3.select('rect#leftBarTimeline');
    const oldRightRect = d3.select('rect#rightBarTimeline');
    const groupBarTimelines = d3.selectAll('g.groupBarTimeline');
    if (!!oldLeftRect) {
      oldLeftRect.remove();
    }
    if (!!oldRightRect) {
      oldRightRect.remove();
    }
    if (!!groupBarTimelines) {
      groupBarTimelines.remove();
    }
  }

  private onRemovingTimeBarDurationById(newSceneId: string) {
    if (newSceneId !== '') {
      return d3.select('#' + newSceneId).remove();
    }
    return false;
  }

  private getPreLeftSubRightScene(currentNewScene: string): any {
    const objResult = {
      preLeft: 0,
      subRight: 0
    };
    if (currentNewScene !== '' && this.listStartStop.length > 1) {
      let count = 0;
      for (const item of this.listStartStop) {
        ++count;
        if ((item.id === currentNewScene)) {
          --count;
          break;
        }
      }
      if (count === 0) {
        objResult.preLeft = -1;
        objResult.subRight = this.listStartStop[count + 1].startAt;
      } else if (count === this.listStartStop.length - 1) {
        objResult.preLeft = this.listStartStop[count - 1].stopAt;
        objResult.subRight = -1;
      } else {
        objResult.preLeft = this.listStartStop[count - 1].stopAt;
        objResult.subRight = this.listStartStop[count + 1].startAt;
      }
      return objResult;
    }
    return null;
  }

  private onRevertSceneBarTimeline(sceneBarOriginal: SceneBar) {
    const index = this.listStartStop.findIndex(item => item.id === (`barTimeline-${sceneBarOriginal.id}`));
    if (index > -1) {
      this.listStartStop[index].startAt = sceneBarOriginal.startTime;
      this.listStartStop[index].stopAt = sceneBarOriginal.endTime;

      const rectBarTimeline = d3.select('rect#barTimeline-' + sceneBarOriginal.id);
      if (!!rectBarTimeline) {
        const xRectLeft = (sceneBarOriginal.startTime / this.maxTimeSliderScale) * this.widthSVG;
        const width = ((sceneBarOriginal.endTime
          - sceneBarOriginal.startTime) / this.maxTimeSliderScale) * this.widthSVG;
        rectBarTimeline.attr('x', xRectLeft)
          .attr('width', width);
      }
    }
  }

}

