import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DASHBOARD_EDIT_XML, messageConstant } from '@app/configs/app-constants';
import { ColorUtil } from '@app/shared/utils/color';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { ToastrService } from 'ngx-toastr';
import {
  ActionStatus,
  ControlBarStatus,
  NewSceneAddedModel,
  SaveDraftStatus, SceneBar,
  SceneBarClicked, SceneBarParams, SceneBarScaling,
  SceneClicked,
  SceneParams,
  TypeOfSavingScene
} from '@app/shared/models/editXMLDataModel';

@Injectable({ providedIn: 'root' })
export class VideoEditXmlService {
  isEditXMLGantt = false;
  listXMLValidated: number[] = [];
  isEditing = false;
  isEditingScene = false;
  isEditingSceneBar = false;
  isAddNewScene = false;
  sceneName = '';
  sceneNameAddNewFromLeftSide = '';
  sceneColor = DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT;
  xmlId = -1;
  xmlName = '';
  maxTimeSliderScale = -1;
  widthSVG = -1;
  maxVideoDuration = -1;
  objSceneBarScaling: SceneBarScaling = new SceneBarScaling(-1, 0, 0);
  objSceneBarClicked: SceneBar = new SceneBar();
  objSceneClicked: SceneClicked = new SceneClicked();

  setEditSceneContent: BehaviorSubject<SceneBarClicked> = new BehaviorSubject<SceneBarClicked>(null);
  setSceneClicked: BehaviorSubject<SceneClicked> = new BehaviorSubject<SceneClicked>(null);
  currentBtnEditIsClickedID: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  obsNewScene: BehaviorSubject<NewSceneAddedModel> = new BehaviorSubject<NewSceneAddedModel>(null);
  saveDraftStatus: BehaviorSubject<SaveDraftStatus> = new BehaviorSubject<SaveDraftStatus>(null);
  isDraft: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  resetFormEditScene: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  reClickScene: BehaviorSubject<string> = new BehaviorSubject<string>('');
  obsResetDefaultTimeline: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  obsClickedSceneBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  obsScalingSceneBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  obsScalingBarTimeline: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  obsRevertSceneBar: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  reloadXMLList: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  obsActionStatus: BehaviorSubject<ActionStatus> = new BehaviorSubject<ActionStatus>(null);
  obsSyncGanttChartToTimeline: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  obsSyncGanttChartRecordsToTimeline: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  obsAddNewType: BehaviorSubject<string> = new BehaviorSubject<string>('');
  sceneDeleted: BehaviorSubject<string> = new BehaviorSubject<string>('');
  sceneBarDeleted: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
  executeEditXML: BehaviorSubject<ControlBarStatus> = new BehaviorSubject<ControlBarStatus>(null);
  reloadXMLAfterSaveAs: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  scalingLeftRightObjList = [];

  rspOnSaveNewSceneBarToExistedScene: BehaviorSubject<SceneBarParams> = new BehaviorSubject<SceneBarParams>(null);
  rspOnSaveOldSceneBarToExistedScene: BehaviorSubject<SceneBarParams> = new BehaviorSubject<SceneBarParams>(null);
  rspOnSaveNewScene: BehaviorSubject<SceneParams> = new BehaviorSubject<SceneParams>(null);
  rspOnSaveOldScene: BehaviorSubject<SceneParams> = new BehaviorSubject<SceneParams>(null);
  rspOnSaveNewSceneBarsToExistedScene: BehaviorSubject<SceneBarParams[]> = new BehaviorSubject<SceneBarParams[]>(null);
  removeAllRecordingSceneBars: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  cancelChangesSceneBars: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  editDecorateRSP_Scene: BehaviorSubject<SceneParams> = new BehaviorSubject<SceneParams>(null);


  constructor(private spinnerService: SpinnerService,
    private dashboardService: DashboardService,
    private dialogService: DialogService,
    private toast: ToastrService) {
  }

  /***
   * Lưu lại giá trị left, right khi scaling bar trên time line
   * Khi scaling new scene bar, cập nhật lại giá trị left, right của scene liền trước, liền sau
   * đã thao tác trên bar time line tương ứng
   * @param event
   * {
   *   "id":"startStop-1",
       "isScaling":true,
       "objPreLeftRight":{"preLeft":2.6301866666666665,"subRight":6.183169}
    /}
   */

  onChoseScene() {
    this.objSceneBarClicked.id = -1;
    this.setSceneClicked.next(this.objSceneClicked);
  }

  getPreviousLeftRightBeforeScaling(newSceneId: string): any {
    const index = this.scalingLeftRightObjList.findIndex(item => item.id === newSceneId);
    if (index > -1) {
      return this.scalingLeftRightObjList[index].objPreLeftRight;
    }
    return null;
  }

  onSaveDraftToExistedScene() {
    const objRequest = {
      xml_id: this.xmlId,
      scene_bar_name: this.obsNewScene.value.sceneName,
      scene_bar_color: ColorUtil.hexToRgb(this.obsNewScene.value.sceneColor),
      scene_bars: []
    };
    this.obsNewScene.value.sceneBars.forEach(item => {
      if (!item.isOriginSceneBar) {
        objRequest.scene_bars.push(
          {
            scene_bar_start: item.startTime,
            scene_bar_end: item.endTime
          });
      }
    });
    if (objRequest.scene_bars.length > 0) {
      this.dashboardService.onSaveSceneBarsEditVideo(objRequest).subscribe(resp => {
        if (resp && resp.id.length > 0) {
          const saveDraftStatus: SaveDraftStatus = new SaveDraftStatus();
          saveDraftStatus.draftSavedNewSceneBarOfExistScene = true;
          this.saveDraftStatus.next(saveDraftStatus);
        }
      }, error => {
        this.toast.error(messageConstant.SCENE_BAR.ADD_MULTIPLE_NEW_FAILED);
      });
    } else {
      this.toast.error(messageConstant.SCENE_BAR.ADD_MULTIPLE_NEW_FAILED);
    }
  }

  onSaveDraft(saveType: TypeOfSavingScene): boolean {
    let result = false;
    if (!!this.objSceneClicked.sceneName && this.xmlId > -1) {
      if (saveType.isUpdateOldScene) {
        this.spinnerService.show();
        if (this.objSceneClicked.sceneName !== this.objSceneClicked.oldSceneName
          || this.objSceneClicked.sceneColor !== this.objSceneClicked.oldSceneColor) {

          let sceneEdited = new SceneParams();
          sceneEdited.xml_id = this.xmlId;
          sceneEdited.current_scene_name = this.objSceneClicked.oldSceneName;
          sceneEdited.scene_name = this.objSceneClicked.sceneName;
          sceneEdited.scene_color = ColorUtil.hexToRgb(this.objSceneClicked.sceneColor)
          this.dashboardService.onUpdateSceneEdit(sceneEdited).subscribe(resp => {
            if (resp) {
              this.spinnerService.hide();
              this.toast.success(messageConstant.SCENE.UPDATE_SUCCESS);
              this.obsActionStatus.next(new ActionStatus(true, true, true));
              result = true;
              this.rspOnSaveOldScene.next(sceneEdited);
            }
          }, error => {
            this.objSceneClicked.sceneName = this.objSceneClicked.oldSceneName;
            this.objSceneClicked.sceneColor = this.objSceneClicked.oldSceneColor;
            this.spinnerService.hide();
            this.toast.error(messageConstant.SCENE.UPDATE_FAILED);
          });
        } else {
          this.spinnerService.hide();
        }
      }
      //
      else if (saveType.isUpdateOldSceneBar) {
        this.spinnerService.show();
        const tags = [];
        this.objSceneBarClicked.tags.forEach(item => {
          tags.push({
            group_name: '',
            tag_name: item
          });
        });
        let scenebarEdited = new SceneBarParams();
        scenebarEdited.xml_id = this.xmlId;
        scenebarEdited.scene_bar_id = this.objSceneBarClicked.id;
        scenebarEdited.scene_bar_name = this.objSceneClicked.sceneName;
        scenebarEdited.scene_bar_color = ColorUtil.hexToRgb(this.objSceneClicked.sceneColor);
        scenebarEdited.scene_bar_start = this.objSceneBarClicked.startTime.toString();
        scenebarEdited.scene_bar_end = this.objSceneBarClicked.endTime.toString();
        scenebarEdited.labels = tags;


        this.dashboardService.onUpdateSceneBarEditVideo(scenebarEdited).subscribe(resp => {
          this.isEditingSceneBar = false;
          this.obsActionStatus.next(new ActionStatus(true, true, true));
          this.rspOnSaveOldSceneBarToExistedScene.next(scenebarEdited);
          this.spinnerService.hide();
          this.toast.success(messageConstant.SCENE_BAR.UPDATE_SUCCESS);
          result = true;
        }, error => {
          this.spinnerService.hide();
          this.toast.error(messageConstant.SCENE_BAR.UPDATE_FAILED);
          result = false;
        });
      }
      //
      else if (saveType.isSaveNewScene) {
        this.spinnerService.show();

        let sceneEdited = new SceneParams();
        sceneEdited.scene_name = this.objSceneClicked.sceneName;
        sceneEdited.xml_id = this.xmlId;
        sceneEdited.scene_color = ColorUtil.hexToRgb(this.objSceneClicked.sceneColor);
        this.dashboardService.onSaveNewSceneEditVideo(sceneEdited).subscribe(respScene => {
          if (respScene && respScene.id.length > 0) {
            this.isEditingScene = false;
            this.isEditingSceneBar = false;
            this.isAddNewScene = false;
            this.spinnerService.hide();
            this.obsActionStatus.next(new ActionStatus(true, true, true));
            this.rspOnSaveNewScene.next(sceneEdited);
            result = true;
          }
        }, error => {
          this.objSceneClicked.sceneName = this.objSceneClicked.oldSceneName;
          this.objSceneClicked.sceneColor = this.objSceneClicked.oldSceneColor;
          this.spinnerService.hide();
          this.toast.error(messageConstant.SCENE.ADD_NEW_FAILED);
          result = false;
        });
      }
    }
    //
    else {
      this.toast.error(messageConstant.XML_EDITING.SAVE_DRAFT_FAILED);
      result = false;
    }
    return result;
  }

  resetParamXMLSession() {
    if (this.obsNewScene.value) {
      this.obsNewScene.value.onReset();
    }
    this.obsAddNewType.next('');
    this.sceneNameAddNewFromLeftSide = '';
    this.obsActionStatus.next(new ActionStatus(false, true, false));
    this.currentBtnEditIsClickedID.next(-1);
  }

  onClickedSceneBar(barId: number) {
    if (barId) {
      const index = this.objSceneClicked.sceneBars.findIndex(item => +item.id === +barId);
      if (index > -1) {
        this.objSceneBarClicked.id = barId;
        this.objSceneBarClicked.startTime = this.objSceneClicked.sceneBars[index].startTime;
        this.objSceneBarClicked.endTime = this.objSceneClicked.sceneBars[index].endTime;
        this.objSceneBarClicked.tags = this.objSceneClicked.sceneBars[index].tags;
        this.objSceneBarClicked.preLeft = this.objSceneClicked.sceneBars[index].preLeft;
        this.objSceneBarClicked.subRight = this.objSceneClicked.sceneBars[index].subRight;
        this.objSceneBarScaling.id = barId;
        this.objSceneBarScaling.startTime = this.objSceneClicked.sceneBars[index].startTime;
        this.objSceneBarScaling.endTime = this.objSceneClicked.sceneBars[index].endTime;
      }
    }
    this.obsClickedSceneBar.next(true);
  }

  onScalingSceneBar(sceneBarScaling: SceneBarScaling) {
    this.isEditingSceneBar = true;
    this.objSceneBarScaling.startTime = sceneBarScaling.startTime;
    this.objSceneBarScaling.endTime = sceneBarScaling.endTime;

    // this.obsClickedSceneBar.next(true);
    this.obsScalingSceneBar.next(true);
    this.obsActionStatus.next(new ActionStatus(false, false, true));
  }

  reSetObjSceneBarClicked() {
    this.objSceneBarClicked.id = -1;
    this.objSceneBarClicked.tags = [];
    this.objSceneBarClicked.startTime = 0;
    this.objSceneBarClicked.endTime = 0;
  }

  onDeleteScene(sceneName: string) {
    this.spinnerService.show();
    const objSceneDeleteRequest = {
      scene_name: sceneName,
      xml_id: +this.xmlId
    };
    this.dashboardService.onDeleteScene(objSceneDeleteRequest).subscribe(resp => {
      if (resp && resp.id.length > 0) {
        this.spinnerService.hide();
        this.toast.success(messageConstant.XML_EDITING.DELETE_SUCCESS);
        this.sceneDeleted.next(sceneName);
      }
    }, error => {
      this.spinnerService.hide();
      this.toast.error(messageConstant.SCENE.DELETE_FAILED);
    });
  }

  onDeleteSceneBar(sceneBarId: number) {
    this.spinnerService.show();
    const objSceneBarDeleteRequest = {
      scene_bar_id: sceneBarId,
      xml_id: this.xmlId
    };
    this.dashboardService.onDeleteSceneBar(objSceneBarDeleteRequest).subscribe(resp => {
      if (resp && resp.id.length > 0) {
        this.sceneBarDeleted.next(+resp.id[0]);
        this.spinnerService.hide();
        this.toast.success(messageConstant.SCENE_BAR.DELETE_SUCCESS);
      }
    }, error => {
      this.spinnerService.hide();
      this.toast.error(messageConstant.SCENE_BAR.DELETE_FAILED);

    });
  }

  onSaveNewSceneBarToExistedScene(params: SceneBarParams) {
    if (params && params.scene_bar_start == "0")
      params.scene_bar_start = "0.01";

    this.dashboardService.onCreateSceneBar4ExistingScene(params).subscribe(resp => {
      if (resp && resp.id.length > 0) {
        params.scene_bar_id = resp.id[0];
        this.rspOnSaveNewSceneBarToExistedScene.next(params);
        this.isDraft.next(true);
      }
    }, error => {
      this.toast.error(messageConstant.SCENE_BAR.ADD_MULTIPLE_NEW_FAILED);
    });
  }

  onSaveNewSceneBarsToExistedScene(params: SceneBarParams[]) {
    const objRequest = {
      xml_id: this.xmlId,
      scene_bar_name: params[0].scene_bar_name,
      scene_bar_color: params[0].scene_bar_color,
      scene_bars: []
    };
    params.forEach(item => {
      objRequest.scene_bars.push(
        {
          scene_bar_start: item.scene_bar_start,
          scene_bar_end: item.scene_bar_end
        });
    });
    if (objRequest.scene_bars.length > 0) {
      this.dashboardService.onSaveSceneBarsEditVideo(objRequest).subscribe(resp => {
        if (resp && resp.id.length > 0) {
          for (var i = 0; i <= params.length - 1; i++)
            params[i].scene_bar_id = resp.id[i];
          this.rspOnSaveNewSceneBarsToExistedScene.next(params);
          this.isDraft.next(true);
        }
      }, error => {
        this.toast.error(messageConstant.SCENE_BAR.ADD_MULTIPLE_NEW_FAILED);
      });
    } else {
      this.toast.error(messageConstant.SCENE_BAR.ADD_MULTIPLE_NEW_FAILED);
    }
  }

}
