import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { VideoEditXmlService } from '@app/core/services/server-services/video-edit-xml.service';
import { DateUtil } from '@app/shared/utils/date';
import { DASHBOARD_EDIT_XML, EDIT_XML_ACTION, EDIT_XML_TYPE, messageConstant } from '@app/configs/app-constants';
import { ActionStatus, ControlBarStatus, SceneBarClicked, SceneClicked, Tags, TypeOfSavingScene } from '@app/shared/models/editXMLDataModel';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ColorUtil } from '@app/shared/utils/color';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-decorate-scene',
  templateUrl: './edit-decorate-scene.component.html',
  styleUrls: ['./edit-decorate-scene.component.scss']
})
export class EditDecorateSceneComponent implements OnInit, OnDestroy {
  readonly editType = EDIT_XML_TYPE;
  public sceneInfoGroup: FormGroup;
  isColorStatus = false;
  isTagNameStatus = false;
  isSceneNameStatus = false;
  isToStatus = false;
  isFromStatus = false;
  isModifyForm = false;
  subs: Subscription[] = [];
  sceneBarTags: Tags[] = [];

  @Input() hintColors: Set<string>;
  @Input() hintTags: Set<string>;
  maskTime = {
    guide: true,
    showMask: true,
    mask: [/\d/, /\d/, ':', /[0-5]/, /\d/, ':', /[0-5]/, /\d/, '.', /\d/, /\d/]
  };

  constructor(
    private formBuilder: FormBuilder,
    private videoEditXMLService: VideoEditXmlService,
    private dateUtil: DateUtil,
    private videoChartService: VideoChartService,
    private dashboardService: DashboardService,
    private toast: ToastrService
  ) {
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
    this.resetInputStatus();

    this.videoEditXMLService.obsScalingSceneBar = new BehaviorSubject<boolean>(null);

  }

  ngOnInit() {
    // this.createNewForm();
    this.subs.push(this.videoEditXMLService.resetFormEditScene.subscribe(status => {
      if (status && this.sceneInfoGroup) {
        this.sceneInfoGroup.reset();
      }
    }));
    this.subs.push(this.videoEditXMLService.setEditSceneContent.subscribe((data: SceneBarClicked) => {
      if (data) {
        if (data.id > -1) {
          this.onUpdateSceneBarContent(data);
        } else {
          if (!!this.sceneInfoGroup) {
            this.onResetEditSceneContent();
            this.changeInputStatus(true, EDIT_XML_ACTION.CLICK_SCENE);
          }
        }
      }
    }));
    this.subs.push(this.videoEditXMLService.obsActionStatus.subscribe((status: ActionStatus) => {
      if (!status) return;
      if (this.videoEditXMLService.isAddNewScene) {
        this.isModifyForm = true;
      } else {
        this.isModifyForm = (!status.letDisableDraftSaveOnEditScene);
      }
    }));
    this.subs.push(this.videoEditXMLService.setSceneClicked.subscribe((data) => {
      if (data) {
        this.onChoosingScene(data);
      }
    }));
    this.subs.push(this.videoEditXMLService.obsClickedSceneBar.subscribe(status => {
      if (status) {
        this.onChoosingSceneBar();
      }
    }));
    this.subs.push(this.videoEditXMLService.obsScalingSceneBar.subscribe(status => {
      if (!!status) {
        this.onScalingSceneBar();
      }
    }));
    this.subs.push(this.videoEditXMLService.reClickScene.subscribe(sceneName => {
      if (!!sceneName) {
        this.isSceneNameStatus = true;
        this.isColorStatus = true;
        this.isFromStatus = false;
        this.isToStatus = false;
        this.isTagNameStatus = false;
      }
    }));
    this.subs.push(this.videoEditXMLService.obsScalingBarTimeline.subscribe((status: boolean) => {
      if (status) {
        this.onScalingSceneBar();
      }
    }));
  }

  private createNewForm() {
    this.sceneInfoGroup = this.formBuilder.group({
      fromTime: this.dateUtil.secondsToTimeFull(0),
      toTime: this.dateUtil.secondsToTimeFull(0),
      sceneName: DASHBOARD_EDIT_XML.SCENE_NAME_DEFAULT,
      tagName: '',
      sceneColor: DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT
    });
  }

  onChoosingScene(data: SceneClicked): void {
    if (data) {
      this.changeInputStatus(true, EDIT_XML_ACTION.CLICK_SCENE);
      this.sceneInfoGroup = this.formBuilder.group({
        fromTime: this.dateUtil.secondsToTimeFull(0),
        toTime: this.dateUtil.secondsToTimeFull(0),
        sceneName: data.sceneName,
        tagName: '',
        sceneColor: data.sceneColor
      });
      this.videoEditXMLService.obsActionStatus.next(new ActionStatus(false, true, true));
    }
  }

  private onChoosingSceneBar(): void {
    if (this.videoEditXMLService.objSceneBarClicked.id > -1) {
      this.isModifyForm = false;
      this.changeInputStatus(true, EDIT_XML_ACTION.CLICK_SCENE_BAR);
      this.sceneBarTags = [];
      this.videoEditXMLService.objSceneBarClicked.tags.forEach(tag => this.sceneBarTags.push(new Tags(tag, false, false)));

      this.sceneInfoGroup.controls.fromTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarClicked.startTime));
      this.sceneInfoGroup.controls.toTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarClicked.endTime));
      this.sceneInfoGroup.controls.tagName.setValue("");
    }
  }

  private onScalingSceneBar() {
    const oldStartTime = this.sceneInfoGroup.controls.fromTime.value;
    const oldEndTime = this.sceneInfoGroup.controls.toTime.value;
    this.sceneInfoGroup.controls.fromTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarScaling.startTime));
    this.sceneInfoGroup.controls.toTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarScaling.endTime));
    this.isModifyForm = true;
  }

  onUpdateSceneBarContent(data: SceneBarClicked): void {
    if (data && +data.id > -1) {
      this.changeInputStatus(true, EDIT_XML_ACTION.CLICK_SCENE_BAR);
      this.sceneInfoGroup.setValue({
        fromTime: [this.dateUtil.secondsToTimeFull(data.startTime)],
        toTime: [this.dateUtil.secondsToTimeFull(data.endTime)],
        sceneName: this.videoEditXMLService.objSceneClicked.sceneName,
        tagName: [data.tags],
        sceneColor: this.videoEditXMLService.objSceneClicked.sceneColor
      });
    }
  }

  changeInputStatus(status: boolean, actionType: string) {
    this.resetInputStatus();
    switch (actionType) {
      case EDIT_XML_ACTION.CLICK_SCENE:
        this.isColorStatus = status;
        this.isSceneNameStatus = status;
        break;
      case EDIT_XML_ACTION.CLICK_SCENE_BAR:
        this.isFromStatus = status;
        this.isToStatus = status;
        this.isTagNameStatus = status;
        break;
      default:
        this.resetInputStatus();
    }
  }

  resetInputStatus(): void {
    this.isColorStatus = false;
    this.isSceneNameStatus = false;
    this.isFromStatus = false;
    this.isToStatus = false;
    this.isTagNameStatus = false;
  }

  cancelChanges() {
    if (this.isModifyForm) {
      if (this.videoEditXMLService.objSceneBarClicked && this.videoEditXMLService.objSceneBarClicked.id > -1) {
        this.sceneInfoGroup.controls.sceneName.setValue(this.videoEditXMLService.objSceneClicked.sceneName);
        this.sceneInfoGroup.controls.sceneColor.setValue(this.videoEditXMLService.objSceneClicked.sceneColor);
        this.sceneInfoGroup.controls.fromTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarClicked.startTime));
        this.sceneInfoGroup.controls.toTime.setValue(this.dateUtil.secondsToTimeFull(this.videoEditXMLService.objSceneBarClicked.endTime));
        this.sceneInfoGroup.controls.tagName.setValue("");

        this.sceneBarTags = this.sceneBarTags.filter((tag, index) => !tag.isNewTag);
        this.sceneBarTags.forEach(tag => tag.willBeDeleted = false);
        if ((this.videoChartService.recordSceneBars && this.videoChartService.recordSceneBars.length > 0)
          || this.videoEditXMLService.objSceneBarClicked) {
          this.videoEditXMLService.obsRevertSceneBar.next(true);
          this.videoEditXMLService.cancelChangesSceneBars.next(true);
        }
        this.isModifyForm = false;
      }
      else if (this.videoEditXMLService.objSceneClicked) {
        this.sceneInfoGroup.controls.sceneName.setValue(this.videoEditXMLService.objSceneClicked.sceneName);
        this.sceneInfoGroup.controls.sceneColor.setValue(this.videoEditXMLService.objSceneClicked.sceneColor);
        this.sceneInfoGroup.controls.fromTime.setValue(this.dateUtil.secondsToTimeFull(0));
        this.sceneInfoGroup.controls.toTime.setValue(this.dateUtil.secondsToTimeFull(0));
        this.sceneInfoGroup.controls.tagName.setValue([]);

        this.isFromStatus = false;
        this.isToStatus = false;
        this.isTagNameStatus = false;
        this.isModifyForm = false;

      }

    }
  }

  onSaveTemp() {
    if (this.sceneInfoGroup.getRawValue().sceneName.toString().trim().length <= 0) {
      this.toast.error(messageConstant.SCENE.NAME_NOT_BE_BLANK);
      return;
    }

    if (this.sceneInfoGroup.getRawValue().tagName.toString().trim().length > 0) {
      this.addTag();
    }

    if (!this.videoEditXMLService.isAddNewScene) {
      // Only save scene
      if (this.isSceneNameStatus) {
        this.videoEditXMLService.objSceneClicked.oldSceneName = this.videoEditXMLService.objSceneClicked.sceneName;
        this.videoEditXMLService.objSceneClicked.oldSceneColor = this.videoEditXMLService.objSceneClicked.sceneColor;
        this.videoEditXMLService.objSceneClicked.sceneName = this.sceneInfoGroup.getRawValue().sceneName;
        this.videoEditXMLService.objSceneClicked.sceneColor = this.sceneInfoGroup.getRawValue().sceneColor;
        this.isModifyForm = !this.videoEditXMLService.onSaveDraft(new TypeOfSavingScene(false, false, true, false));
      }
      // Only save scene bar
      else if (this.isFromStatus) {
        let newTags: any = [];
        this.sceneBarTags = this.sceneBarTags.filter(tag => (!tag.willBeDeleted || tag.isNewTag) && tag.name.length > 0);
        this.sceneBarTags.forEach(tag => newTags.push(tag.name));

        this.videoEditXMLService.objSceneBarClicked.startTime = this.dateUtil.stringTimeToMilSeconds(this.sceneInfoGroup.getRawValue().fromTime);
        this.videoEditXMLService.objSceneBarClicked.endTime = this.dateUtil.stringTimeToMilSeconds(this.sceneInfoGroup.getRawValue().toTime);
        this.videoEditXMLService.objSceneBarClicked.tags = newTags;
        this.isModifyForm = !this.videoEditXMLService.onSaveDraft(new TypeOfSavingScene(false, false, false, true));
      }
    }
    //
    else {
      this.videoEditXMLService.objSceneClicked.oldSceneName = this.videoEditXMLService.objSceneClicked.sceneName;
      this.videoEditXMLService.objSceneClicked.oldSceneColor = this.videoEditXMLService.objSceneClicked.sceneColor;
      this.videoEditXMLService.objSceneClicked.sceneName = this.sceneInfoGroup.getRawValue().sceneName;
      this.videoEditXMLService.objSceneClicked.sceneColor = this.sceneInfoGroup.getRawValue().sceneColor;
      this.isModifyForm = !this.videoEditXMLService.onSaveDraft(new TypeOfSavingScene(true, false, false, false));
      this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, true, false, false));
    }
    this.videoEditXMLService.isDraft.next(true);

    if (this.videoEditXMLService.objSceneClicked && this.videoEditXMLService.objSceneClicked.sceneColor)
      this.hintColors.add(this.videoEditXMLService.objSceneClicked.sceneColor);

    if (this.videoEditXMLService.objSceneBarClicked && this.videoEditXMLService.objSceneBarClicked.tags)
      this.videoEditXMLService.objSceneBarClicked.tags.forEach(tag => this.hintTags.add(tag));

    if (this.hintColors.size > 10)
      this.hintColors.delete(this.hintColors[0]);

    if (this.hintTags.size > 10)
      this.hintTags.delete(this.hintTags[0]);


  }

  onHandleChangingForm(event: Event, editType: number) {
    if (event) {
      if (editType === EDIT_XML_TYPE.SCENE) {
        this.videoEditXMLService.isEditingScene = true;
        this.videoEditXMLService.isEditingSceneBar = false;
      } else if (editType === EDIT_XML_TYPE.SCENE_BAR) {
        //this.videoEditXMLService.isEditingScene = false;
        this.videoEditXMLService.isEditingSceneBar = true;
      }
      this.isModifyForm =this.isModifyForm?this.isModifyForm : 
                                          !event["color"] || 
                                          (event["color"] && (!this.videoEditXMLService.objSceneBarClicked || 
                                                              !this.videoEditXMLService.objSceneBarClicked.id ||
                                                              this.videoEditXMLService.objSceneBarClicked.id < 0));
      this.videoEditXMLService.isEditing = this.isModifyForm;
    }
  }
  handleChangeComplete($event) {
    if (!this.videoEditXMLService.objSceneBarClicked || !this.videoEditXMLService.objSceneBarClicked.id ||
      this.videoEditXMLService.objSceneBarClicked.id < 0)
      this.sceneInfoGroup.controls.sceneColor.setValue($event.color.hex);
  }
  private onResetEditSceneContent() {
    this.videoEditXMLService.reSetObjSceneBarClicked();
    this.resetInputStatus();
    this.sceneInfoGroup.setValue({
      fromTime: this.dateUtil.secondsToTimeFull(0),
      toTime: this.dateUtil.secondsToTimeFull(0),
      sceneName: this.videoEditXMLService.objSceneClicked.sceneName,
      tagName: [],
      sceneColor: this.videoEditXMLService.objSceneClicked.sceneColor
    });
    this.sceneBarTags = [];
  }

  removeTag(data: any): void {
    const { name } = data;
    this.sceneBarTags.forEach(tag => tag.name == name ? (tag.willBeDeleted = true, tag.name = '') : tag.willBeDeleted);
    let a = '';
  }

  addTag(event?: any): void {
    let tagName = this.sceneInfoGroup.controls.tagName.value;
    if (tagName.toString().trim().length <= 0) return;
    let tagsName = [];
    if (tagName.includes(','))
      tagsName = tagName.split(',');
    else
      tagsName.push(tagName);
    this.sceneInfoGroup.controls.tagName.setValue("");
    tagsName.forEach((tag, index) => this.sceneBarTags.push(new Tags(tag, true, false)));
    const eventInput = event.relatedTarget.id;
    if (eventInput && eventInput=== 'btnSave') {
      this.onSaveTemp();
    }
  }


}
