import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit, OnChanges,
  Output,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit
} from '@angular/core';
import { DateUtil } from '@app/shared/utils/date';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';
import { Subscription } from 'rxjs';
import { DashboardSliderScalingComponent } from '@app/modules/dashboard/components/dashboard-slider-scaling/dashboard-slider-scaling.component';
import { VideoEditXmlService } from '@app/core/services/server-services/video-edit-xml.service';
import { NewSceneAddedModel, SaveDraftStatus, SceneBar, SceneBarClicked, SceneBarParams } from '@app/shared/models/editXMLDataModel';
import { EDIT_XML_ACTION } from '@app/configs/app-constants';
import { ColorUtil } from '@app/shared/utils/color';

@Component({
  selector: 'app-controll-bar',
  templateUrl: './controll-bar.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./controll-bar.component.scss']
})
export class ControllBarComponent implements OnInit, OnDestroy {
  @Input() maxTimeSliderScale = 0;
  @Input() isEditXML = false;
  @Input() isClickEditBtn = false;
  @Input() value = 5;
  @Input() objResult: any;
  @Input() allowEditSceneBarByBtn = false;
  @Output() outHandleOnSaveScalingSliderTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() outHandleScalingTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() outHandleLeftRightNewSceneGanttChart: EventEmitter<any> = new EventEmitter<any>();
  @Output() outHandlePreLeftSubRightScene: EventEmitter<any> = new EventEmitter<any>();
  @Output() outHandleIsScalingLeftRight: EventEmitter<any> = new EventEmitter<any>();
  @Output() outHandleRemovingNewSceneScalingTime: EventEmitter<string> = new EventEmitter<string>();
  @Output() outHandleOnSave: EventEmitter<any> = new EventEmitter<any>();
  @Output() outScalingTime: EventEmitter<any> = new EventEmitter<any>();
  @Output() outIdRemovingNewScene: EventEmitter<string> = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() outEventHandleNewSceneGanttChart = new EventEmitter<any>();
  @ViewChild(DashboardSliderScalingComponent, { static: false }) sliderScalingInstance: DashboardSliderScalingComponent;

  speed = 1;
  current = 0;
  maxTime = 0;
  ended = false;
  currentString;
  maxTimeString;
  isPlay = false;
  speedIndex = 4;
  speeds = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 4, 10];
  lastestSaved: number = 0;

  subscriptions: Subscription[] = [];
  // Wrap buttons add new scene on timeline
  onRecording = false;
  isShowSaveButton = false;
  isShowRemoveAllButton = false;
  isEnablePlaySceneBarBtn = false;
  isEnablePauseSceneBarBtn = false;
  isEnableUndoSceneBarBtn = false;
  // End Wrap buttons add new scene on timeline


  constructor(
    private dateUtil: DateUtil,
    private videoChartService: VideoChartService,
    private videoChartCommentService: VideoChartCommentService,
    private videoEditXMLService: VideoEditXmlService
  ) { }


  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.composedPath().length < 17 && event.code === 'Space') {
      this.changePlay(event, !this.isPlay);
    }
  }

  ngOnChanges() {
    if (this.allowEditSceneBarByBtn)
      this.changeStateButton(true, false, false, false, false);
    else
      this.changeStateButton();
  }

  ngOnInit() {
    this.videoEditXMLService.obsResetDefaultTimeline.subscribe((data: boolean) => {
      if (data) {
        this.isShowRemoveAllButton = false;
        this.isShowSaveButton = false;
      }
    });

    this.videoEditXMLService.saveDraftStatus.subscribe((data: SaveDraftStatus) => {
      if (data) {
        if (data.draftSavedNewSceneBarOfExistScene) {
          this.isShowSaveButton = false;
          this.isShowRemoveAllButton = false;
        }
      }
    });

    this.videoEditXMLService.currentBtnEditIsClickedID.subscribe(xmlId => {
      //this.isClickEditBtn = xmlId !== -1;
    });

    this.videoChartService.refreshVideoData();
    this.currentString = this.dateUtil.secondsToTime(this.current);
    this.maxTimeString = this.dateUtil.secondsToTime(this.maxTime);

    // Listen to event from dashboard-video component
    const s1 = this.videoChartService.duration.subscribe(d => {
      this.maxTime = Math.floor(d);
      this.videoEditXMLService.maxTimeSliderScale = this.maxTime;
      this.maxTimeString = this.dateUtil.secondsToTime(this.maxTime);
    });

    const s2 = this.videoChartService.data.subscribe(data => {
      this.isPlay = data.play;
      this.current = data.currentTime;
      this.current = Math.max(this.current, 0);
      this.current = Math.min(this.current, this.maxTime);
      if (this.onRecording && !this.checkStopRecord())
        this.onStop();
      this.videoChartCommentService.currentTime.next(this.current);
      this.currentString = this.dateUtil.secondsToTime(this.current);
    });

    const s3 = this.videoChartService.ended.subscribe(end => {
      if (end) {
        this.isPlay = false;
        this.ended = true;
        this.videoChartService.dataVideo.play = false;
      }
    });

    this.subscriptions.push(this.videoEditXMLService.executeEditXML.subscribe(data => {
      if (data)
        this.changeStateButton(data.isEnablePlaySceneBarBtn, data.isEnablePauseSceneBarBtn, data.isShowSaveButton, data.isEnableUndoSceneBarBtn, data.isShowRemoveAllButton);
    }));
    this.subscriptions.push(s1, s2, s3);

    this.subscriptions.push(this.videoEditXMLService.obsClickedSceneBar.subscribe(status => {
      if (status) {
        if (this.videoEditXMLService.objSceneBarClicked.id != -1)
          this.changeStateButton();
        else
          this.changeStateButton(true);

      }
    }));
  }

  // Handle and emit seek event
  sliderMoveFormat(value) {
    this.current = value;
    this.current = Math.min(this.current, this.maxTime);
    this.videoChartService.seek(true, this.current);
    this.currentString = this.dateUtil.secondsToTime(this.current);
    this.videoChartService.seekEnd();
  }

  // Handle and emit next/previous scene event
  changeScene(event, key) {
    this.videoChartService.changeScene(key);
    this.videoChartService.changeScene(0);
  }

  // Handle and emit play/pause event
  changePlay(event, key) {
    if (this.ended) {
      if (this.current === this.maxTime) {
        this.videoChartService.seek(true, 0);
        this.currentString = this.dateUtil.secondsToTime(0);
      }
      this.videoChartService.seekEnd();
      this.ended = false;
      setTimeout(() => {
        this.videoChartService.changeIsPlay(key);
      }, 200);
    } else {
      this.videoChartService.changeIsPlay(key);
    }
    this.isPlay = key;

    if (key && !this.videoChartService.sceneBarEdited && !this.onRecording)
      this.lastestSaved = 0;

    // if (!key && this.onRecording)
    //   this.onStop();
    // else if (key && !this.videoChartService.sceneBarEdited && !this.onRecording)
    //   this.lastestSaved = 0;
    // else if (key && this.videoChartService.sceneBarEdited && !this.onRecording)
    //   this.onStart();
  }

  changeSpeed(event, key) {
    if (key === 1) {
      if (this.speedIndex !== this.speeds.length - 1) {
        this.speedIndex += key;
      }
    } else {
      if (this.speedIndex > 0) {
        this.speedIndex += key;
      }
    }
    this.speed = this.speeds[this.speedIndex];
    this.videoChartService.changeSpeed(this.speed);
  }

  seekTime(event, key) {
    this.videoChartService.seekAddition(Number(key));
    this.videoChartService.seekEnd();
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  // Wrap function for slider scaling
  handleSaveSliderScaling(event: any) {
    this.outHandleOnSaveScalingSliderTime.emit(event);
  }

  handleScalingTime(event: any) {
    this.outHandleScalingTime.emit(event);
  }

  handleRemovingNewSceneScalingTime(event: string) {
    this.outHandleRemovingNewSceneScalingTime.emit(event);
  }

  onHandleNewSceneGanttChart(event: any) {
    this.outHandleLeftRightNewSceneGanttChart.emit(event);
  }

  onHandlePreLeftSubRightScene(event: any) {
    this.outHandlePreLeftSubRightScene.emit(event);
  }

  onHandleIsScalingLeftRight(event: any) {
    this.outHandleIsScalingLeftRight.emit(event);
  }
  // End wrap function for slider scaling

  onStart() {
    if (this.isEnablePlaySceneBarBtn) {
      this.current = this.current < 0.1 || isNaN(this.current) ? 0.1 : this.current;
      if (this.checkStartRecord()) {
        if (!this.videoChartService.sceneBarEdited) {
          this.videoChartService.sceneBarEdited = new SceneBar;
          this.videoChartService.sceneBarEdited.idRecord = 'Record-' + (this.videoEditXMLService.objSceneClicked.recordSceneBars.length + 1);
          this.videoChartService.sceneBarEdited.startTime = this.lastestSaved > 0 && this.lastestSaved >= this.current ? this.lastestSaved : this.current;
          this.videoChartService.sceneBarEdited.endTime = null;
          this.videoChartService.sceneBarEdited.isOriginSceneBar = false;
        }

        this.onRecording = true;
        this.videoEditXMLService.isEditingSceneBar = true;
        this.changeStateButton(false, true);
        // if (!this.isPlay)
        //   this.changePlay(({}), true);
        this.sliderScalingInstance.onStart(this.videoChartService.sceneBarEdited.startTime);
      }
    }
    else if (this.isEnablePauseSceneBarBtn) {
      this.onStop();
    }

  }

  onStop() {
    if (!this.isEnablePauseSceneBarBtn) return;
    if (this.videoChartService.sceneBarEdited)
      this.videoChartService.sceneBarEdited.endTime = this.current;

    if (this.videoChartService.sceneBarEdited.endTime > this.videoChartService.sceneBarEdited.startTime) {
      const sceneBarParams = new SceneBarParams();
      sceneBarParams.xml_id = this.videoEditXMLService.xmlId;
      sceneBarParams.scene_bar_name = this.videoEditXMLService.setSceneClicked.value.sceneName;
      sceneBarParams.scene_bar_color = ColorUtil.hexToRgb(this.videoEditXMLService.setSceneClicked.value.sceneColor);
      sceneBarParams.scene_bar_start = this.videoChartService.sceneBarEdited.startTime.toString();
      sceneBarParams.scene_bar_end = this.videoChartService.sceneBarEdited.endTime.toString();
      sceneBarParams.labels = [];
      this.videoChartService.recordSceneBars.push(sceneBarParams);
      this.videoEditXMLService.objSceneClicked.recordSceneBars.push(this.videoChartService.sceneBarEdited);

      const lengthRecords = this.videoChartService.recordSceneBars.length;
      this.videoChartService.seek(false, parseFloat(this.videoChartService.recordSceneBars[lengthRecords - 1].scene_bar_end) + 0.1);

      this.changeStateButton(true, false, true, false, true);
    }
    else {
      const lengthRecords = this.videoChartService.recordSceneBars.length;
      this.changeStateButton(true, false, lengthRecords > 0, false, lengthRecords > 0);
    }
    this.onRecording = false;
    // if (this.isPlay)
    //   this.changePlay({}, false);

    this.sliderScalingInstance.onStop(this.current);
    this.videoEditXMLService.obsSyncGanttChartRecordsToTimeline.next(this.videoChartService.sceneBarEdited.idRecord);
    this.videoChartService.sceneBarEdited = null;

    this.onSave();
  }

  onUndoNewScene() {
    if (this.isClickEditBtn) {
      this.sliderScalingInstance.onUndoNewScene();
    }
  }
  onSaveOld() {
    const newSceneAddedModel = new NewSceneAddedModel();
    newSceneAddedModel.oldSceneName = this.videoEditXMLService.setSceneClicked.value.oldSceneName;
    newSceneAddedModel.sceneName = this.videoEditXMLService.setSceneClicked.value.sceneName;
    newSceneAddedModel.sceneColor = this.videoEditXMLService.setSceneClicked.value.sceneColor;
    newSceneAddedModel.isAddedFrom = EDIT_XML_ACTION.ADD_NEW_BY_LEFT_SIDE_BUTTON;
    newSceneAddedModel.isUpdate = false;
    newSceneAddedModel.placeEditingOn = EDIT_XML_ACTION.EDITING_ON_EXIST_SCENE;
    newSceneAddedModel.sceneBars = this.videoEditXMLService.setSceneClicked.value.sceneBars;
    this.videoEditXMLService.obsNewScene.next(newSceneAddedModel);

    this.videoEditXMLService.obsNewScene.value.sceneBars.push(this.videoChartService.sceneBarEdited);

    this.videoEditXMLService.isDraft.next(true);
    this.sliderScalingInstance.onSave();
    const length = this.videoEditXMLService.obsNewScene.value.sceneBars.length;
    if (this.videoChartService.sceneBarEdited) {
      this.videoEditXMLService.obsNewScene.value.sceneBars[length + 1].isOriginSceneBar = true;
      this.videoChartService.sceneBarEdited = null;
    }
  }

  onSave() {
    if (!this.isShowSaveButton) return;
    this.sliderScalingInstance.onSaveNewSceneBars(this.videoChartService.recordSceneBars);

    const lengthRecords = this.videoChartService.recordSceneBars.length;
    this.videoChartService.seek(false, parseFloat(this.videoChartService.recordSceneBars[lengthRecords - 1].scene_bar_end) + 0.1);
    this.videoChartService.recordSceneBars = [];
    this.videoEditXMLService.objSceneClicked.recordSceneBars = [];
    this.videoEditXMLService.isEditingSceneBar = false;
    this.videoEditXMLService.removeAllRecordingSceneBars.next(true);
    this.changeStateButton(true, false, false, false);
  }

  onRemoveAll() {
    if (this.isClickEditBtn && this.isShowRemoveAllButton) {
      this.videoChartService.recordSceneBars = [];
      this.videoEditXMLService.objSceneClicked.recordSceneBars = [];
      this.videoEditXMLService.removeAllRecordingSceneBars.next(true);
    }
  }

  private checkStartRecord() {
    let valid: boolean = true;
    for (var sceneBar of this.videoEditXMLService.objSceneClicked.sceneBars) {
      if (sceneBar.startTime < 0) continue;
      if ((Number(this.current.toFixed(3)) >= Number(Number(sceneBar.startTime).toFixed(3))
        && Number(this.current.toFixed(3)) <= Number(Number(sceneBar.endTime).toFixed(3)))) {
        valid = false;
        return valid;
      }
    }
    return valid;
  }

  private checkStopRecord() {
    let valid: boolean = true;
    for (var sceneBar of this.videoEditXMLService.objSceneClicked.sceneBars) {
      if (sceneBar.startTime < 0) continue;
      if ((Number(this.current.toFixed(3)) > Number(Number(sceneBar.startTime).toFixed(3)) && Number(this.current.toFixed(3)) < Number(Number(sceneBar.endTime).toFixed(3)))
        || Number(this.current.toFixed(3)) == Number(Number(sceneBar.startTime).toFixed(3)) || Number(this.current.toFixed(3)) == Number(Number(sceneBar.endTime).toFixed(3))) {
        valid = false;
        this.current = sceneBar.startTime - 0.5;
        return valid;
      }
    }
    return valid;
  }

  changeStateButton(isEnablePlaySceneBarBtn = false, isEnablePauseSceneBarBtn = false, isShowSaveButton = false,
    isEnableUndoSceneBarBtn = false, isShowRemoveAllButton = false) {
    this.isShowSaveButton = isShowSaveButton;
    this.isShowRemoveAllButton = isShowRemoveAllButton;
    this.isEnablePlaySceneBarBtn = isEnablePlaySceneBarBtn;
    this.isEnablePauseSceneBarBtn = isEnablePauseSceneBarBtn;
    this.isEnableUndoSceneBarBtn = isEnableUndoSceneBarBtn;
  }
}
