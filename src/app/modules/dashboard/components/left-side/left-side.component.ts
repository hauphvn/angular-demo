import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { SceneTagService } from '@app/core/services/component-services/scene-tag.service';
import { ColorUtil } from '@app/shared/utils/color';
import { DASHBOARD_EDIT_XML, EDIT_XML_ACTION, EDIT_XML_PATTERN, HTTP_STATUS_CODE, messageConstant, VIDEO_MANAGEMENT_RESPONSE } from '@app/configs/app-constants';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { VideoEditXmlService } from '@app/core/services/server-services/video-edit-xml.service';
import { MatDialog, MatMenuTrigger } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { PopupSaveAsXmlComponent } from '@app/modules/dashboard-edit-xml/components/popup-save-as-xml/popup-save-as-xml.component';
import { ActionStatus, ControlBarStatus } from '@app/shared/models/editXMLDataModel';
import { DateUtil } from '@app/shared/utils/date';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ReturnStatement } from '@angular/compiler';

@Component({
  selector: 'app-left-side',
  templateUrl: './left-side.component.html',
  styleUrls: ['./left-side.component.scss']
})
export class LeftSideComponent implements OnInit, OnChanges {
  @Input() listXML: any[];
  @Input() listTimeSeries: any[];
  @Input() scenes;
  @Input() tags;
  @Input() scenesFilter;
  @Input() tagsFilter;
  @Input() videoTitle;
  @Input() videoID;
  // Edit XML
  @Input() isEditXML = false;
  @Input() isShowGanttChart = false;
  @ViewChildren(MatMenuTrigger) matMenuTrigger: QueryList<MatMenuTrigger>;
  menuRightClickScenePosition = { x: '0', y: '0' };
  menuLeftClickSavePosition = { x: '0', y: '0' };
  xmlIdCurrent = -1;
  sceneCurrentId = -1;
  isClickEditBtn = false;
  isModifying = false;
  isShowBtnSave = false;
  isReRender = false;
  currentSceneName = '';
  classListSceneClicked: any;
  editingAddNewSceneButton = false;
  enableBtnCreateNew = false;
  enableBtnLoadDraftXML = false;
  // End edit XML
  @Output() dataClick = new EventEmitter<any>();
  @Output() timeSeriesClick = new EventEmitter<any>();
  @Output() tagsClick = new EventEmitter<any>();
  @Output() outScenesClick = new EventEmitter<any>();
  @Output() scenesFilterChange = new EventEmitter<any>();
  @Output() tagsFilterChange = new EventEmitter<any>();
  @Output() outEditXMLById = new EventEmitter<number>();
  @Output() outOnClickXML = new EventEmitter<void>();
  @Output() onReLoadXml = new EventEmitter<void>();

  from = 'left';


  constructor(
    private dateUtil: DateUtil,
    public dialog: MatDialog,
    private dashboardService: DashboardService,
    private toast: ToastrService,
    private videoEditXMLService: VideoEditXmlService,
    private scenetagService: SceneTagService,
    private spinnerService: SpinnerService,
    private dialogService: DialogService) {
  }

  ngOnInit() {
    this.videoEditXMLService.sceneDeleted.subscribe(sceneName => {
      if (!!sceneName) {
        const index = this.scenes.findIndex(item => item.name === sceneName);
        this.scenes.splice(index, 1);
      }
      this.videoEditXMLService.isEditingScene = false;
    });
    this.videoEditXMLService.obsActionStatus.subscribe(status => {
      if (status) {
        if (status.letUpdateUIScene
          && (this.videoEditXMLService.objSceneClicked.oldSceneName || this.videoEditXMLService.objSceneClicked.sceneName)) {
          this.isModifying = true;
          let indexScene = this.scenes.findIndex(item => item.name === this.videoEditXMLService.objSceneClicked.oldSceneName);
          indexScene = indexScene > -1 ? indexScene : this.scenes.findIndex(item => item.name === this.videoEditXMLService.objSceneClicked.sceneName);
          this.scenes[indexScene].name = this.videoEditXMLService.objSceneClicked.sceneName;
          this.scenes[indexScene].color = ColorUtil.hexToRgb(this.videoEditXMLService.objSceneClicked.sceneColor);
          this.scenes[indexScene].isNewScene = false;
          this.currentSceneName = this.videoEditXMLService.objSceneClicked.sceneName;
        }
      }
    });
    this.videoEditXMLService.obsNewScene.subscribe((data) => {
      if (data !== null) {
        if (data.isAddedFrom === EDIT_XML_ACTION.ADD_NEW_BY_LEFT_SIDE_BUTTON) {
          const index = this.scenes.findIndex(item => item.name === this.videoEditXMLService.obsNewScene.value.oldSceneName);
          if (index > -1) {
            this.videoEditXMLService.obsNewScene.value.oldSceneName = this.videoEditXMLService.obsNewScene.value.sceneName;
            this.scenes.splice(index, 1, { name: data.sceneName, color: data.sceneColor });
          } else {
            this.scenes.push({
              name: data.sceneName,
              color: data.sceneColor
            });
          }
        }
      }
    });

    this.videoEditXMLService.isDraft.subscribe(status => {
      this.isShowBtnSave = status;
    });
    this.scenetagService.scenes.subscribe(({ from, newList }) => {
      // Listen from other source
      if (from !== this.from) {
        if (newList.length === 0) {
          this.activeAllScene();
        } else {
          this.removeActiveAll('scene');
          newList.forEach(scene => {
            this.activeAnItem('scene', scene);
          });
        }
      }
    });

    this.videoEditXMLService.reloadXMLAfterSaveAs.subscribe((data) => {
      if (data && data.length > 0) {
        this.onEditXML(data);
      }
    });
  }

  ngOnDestroy() {
    this.videoEditXMLService.obsActionStatus = new BehaviorSubject<ActionStatus>(null);
  }


  ngOnChanges(changes: SimpleChanges) {
    this.activeAllScene();
    this.scenetagService.clearScene(this.from, this.isClickEditBtn);
  }

  toggleDataActive(xml: any, editXML?: boolean) {
    /***
     * Edit XML mode:
     *  - Only a xml is chosen
     */
    if (this.isEditXML && xml.id !== this.xmlIdCurrent) {
      if (this.isModifying) {
        const param = {
          type: 'confirm',
          title: 'CONFIRM',
          message: messageConstant.XML_EDITING.DO_NOT_SAVE
        };
        this.dialogService.confirm(param).subscribe(result => {
          if (result) {
            this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, false, false, false));
            this.videoEditXMLService.obsResetDefaultTimeline.next(true);
            this.editingAddNewSceneButton = false;
            this.videoEditXMLService.resetParamXMLSession();
            this.dataClick.emit({ isRemoveAllXML: true });
            this.isModifying = false;
            this.onResetButtonsEditXML(this.xmlIdCurrent);
            if (this.xmlIdCurrent !== xml.id) {
              this.isClickEditBtn = false;
              this.xmlIdCurrent = xml.id;
              const listItem = document.querySelectorAll('.myInActive, .myActive, .wrapIconsBtn');
              const sizeListItem = listItem.length;
              for (let i = 0; i < sizeListItem; i++) {
                listItem[i].classList.remove('myInActive', 'myActive', 'wrapIconsBtn');
              }
              document.getElementById('xmlId-' + xml.id).classList.add('myInActive');
              document.getElementById('xmlId-name-' + xml.id).classList.add('myActive');
              document.getElementById('wrap-icon-btn-' + xml.id).classList.add('wrapIconsBtn');
            }
            if (editXML)
              this.onEditXML(xml);
          }
        });
      }
      //
      else {
        //editAfterToggle used in case change from XML (in editing mode) to another XML.
        const editAfterToggle = this.isClickEditBtn;
        // Default do not anything
        this.onResetButtonsEditXML(this.xmlIdCurrent);
        if (this.xmlIdCurrent !== xml.id) {
          this.isClickEditBtn = false;
          this.xmlIdCurrent = xml.id;
          const listItem = document.querySelectorAll('.myInActive, .myActive, .wrapIconsBtn');
          const sizeListItem = listItem.length;
          for (let i = 0; i < sizeListItem; i++) {
            listItem[i].classList.remove('myInActive', 'myActive', 'wrapIconsBtn');
          }
          document.getElementById('xmlId-' + xml.id).classList.add('myInActive');
          document.getElementById('xmlId-name-' + xml.id).classList.add('myActive');
          document.getElementById('wrap-icon-btn-' + xml.id).classList.add('wrapIconsBtn');
        }
        if (editAfterToggle) {
          this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, false, false, false));
          this.videoEditXMLService.obsResetDefaultTimeline.next(true);
          this.editingAddNewSceneButton = false;
          this.videoEditXMLService.resetParamXMLSession();
          this.dataClick.emit({ isRemoveAllXML: true });
        }

        if (editXML)
          this.onEditXML(xml);
      }
    }
    //NOT Edit XML
    else if (!this.isEditXML) {
      // tslint:disable-next-line:no-shadowed-variable
      const numActive = this.listXML.filter(xml => xml.select).length;

      if (xml.select) {
        if (numActive > 1) {
          xml.select = false;
          this.dataClick.emit({ choose: false, id: xml.id });
        }
      } else if (numActive < 10) {
        xml.select = true;
        this.dataClick.emit({ choose: true, id: xml.id });
      }
    }
  }

  private retrieveGetXMLMetaDataEditVideo(xml: any) {
    this.dataClick.emit({ choose: false, id: xml.id, isEditXML: this.isEditXML });
  }

  toggleTimeSeriesActive(item) {
    const numActive = this.listTimeSeries.filter(csv => csv.select).length;
    if (item.select) {
      if (numActive > 1) {
        item.select = false;
        this.timeSeriesClick.emit({ choose: false, id: item.id });
      }
    } else if (numActive < 10) {
      item.select = true;
      this.timeSeriesClick.emit({ choose: true, id: item.id });
    }
  }

  handleSceneClick(event, sceneName: string, sceneId = -1) {
    if (!this.isEditXML) {
      this.onHandleSceneClicked(event, sceneName);
    }
    //
    else {
      if (!this.currentSceneName) {
        this.videoEditXMLService.isEditingScene = true;
        if (!this.isReRender) {
          this.classListSceneClicked = event.target.classList;
        }
        this.sceneCurrentId = sceneId;
        this.currentSceneName = sceneName;
        const index = this.scenes.findIndex(item => item.name === sceneName);
        if (index > -1) {
          this.videoEditXMLService.isAddNewScene = this.scenes[index].isNewScene ? true : false;
          const color = this.scenes[index].color;
          this.videoEditXMLService.objSceneClicked.sceneName = sceneName;
          this.videoEditXMLService.objSceneClicked.oldSceneName = sceneName;
          this.videoEditXMLService.objSceneClicked.sceneColor = ColorUtil.RGBToHex(color);
          this.videoEditXMLService.objSceneClicked.oldSceneColor = ColorUtil.RGBToHex(color);
          this.videoEditXMLService.onChoseScene();
          this.videoEditXMLService.obsActionStatus.next(new ActionStatus(false, true, true));
          this.onHandleSceneClicked(event, sceneName);
        }
        this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, !this.scenes[index].isNewScene, false, false));
        this.outScenesClick.emit({ allowEditSceneBarByBtn: this.scenes[index].isNewScene ? false : true, sceneNameClicked: sceneName });
        this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene && this.isClickEditBtn && !this.editingAddNewSceneButton;
      }
      //
      else if (this.currentSceneName === sceneName) {
        this.videoEditXMLService.isEditingScene = false;
        this.videoEditXMLService.obsResetDefaultTimeline.next(true);
        this.videoEditXMLService.obsActionStatus.next(new ActionStatus(false, true, false));
        this.onHandleSceneClicked(event, sceneName);
        this.editingAddNewSceneButton = false;
        this.currentSceneName = '';
        this.outScenesClick.emit({ allowEditSceneBarByBtn: false, sceneNameClicked: this.currentSceneName });
        this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, false, false, false));
        this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene && this.isClickEditBtn && !this.editingAddNewSceneButton;
      }
    }
  }

  private onHandleSceneClicked(event: any, sceneName: string) {
    let classList: any;
    if (this.isReRender) {
      this.videoEditXMLService.obsActionStatus.next(new ActionStatus(false, true, false));
      document.querySelectorAll('.scene-item.active').forEach(e => {
        e.classList.remove('active');
        e.classList.remove('border-active');
      });
      document.getElementById('sceneId-' + this.sceneCurrentId).classList.add('active');
      this.scenetagService.addScene(this.from, sceneName, this.isClickEditBtn);
      this.videoEditXMLService.onChoseScene();
      return;
    } else {
      classList = event.target.classList;
    }
    const hasActive = classList.contains('active');
    const notActive = document.querySelectorAll('.scene-item:not(.active)').length;
    if (notActive === 0 && this.scenetagService.sceneList.length == 0) {
      // All is activing
      document.querySelectorAll('.scene-item.active').forEach(e => {
        e.classList.remove('active');
        e.classList.remove('border-active');
        e.classList.add('disabled');
      });
      classList.add('active');
      classList.remove('disabled');
      classList.add('border-active');
      this.scenetagService.addScene(this.from, sceneName, this.isClickEditBtn);
    } else {
      if (hasActive) {
        classList.remove('active');
        classList.add('disabled');
        classList.remove('border-active');
        this.scenetagService.removeScene(this.from, sceneName, this.isClickEditBtn);
        if (document.querySelectorAll('.scene-item.active').length === 0) {
          // All is unactive
          // Active all
          this.activeAllScene();
          this.scenetagService.clearScene(this.from); // scenes empty => active all
        }
      } else {
        classList.add('active');
        classList.remove('disabled');
        this.scenetagService.addScene(this.from, sceneName, this.isClickEditBtn);
      }
    }
  }

  handleTagClick(event, tagName: string) {
    const { classList } = event.target;
    const hasActive = classList.contains('active');
    if (hasActive) {
      classList.remove('active');
      classList.add('disabled');
      classList.remove('border-active');
      this.scenetagService.removeTag(this.from, tagName);
    } else {
      classList.add('active');
      classList.remove('disabled');
      this.scenetagService.addTag(this.from, tagName);
    }
  }

  activeAllScene() {
    document.querySelectorAll('.scene-item').forEach(e => {
      if (!e.classList.contains('active')) {
        e.classList.add('active');
      }
      if (e.classList.contains('disabled')) {
        e.classList.remove('disabled');
      }
    });
  }

  activeAnItem(type: string, value: string) {
    // type: scene or tag
    document.querySelectorAll(`.${type}-item`).forEach(e => {
      if (e.innerHTML.trim() === value) {
        e.classList.add('active');
      }
    });
  }

  removeActiveAnItem(type: string, value: string) {
    // type: scene or tag
    document.querySelectorAll(`.${type}-item.active`).forEach(e => {
      if (e.innerHTML.trim() === value) {
        e.classList.remove('active');
        e.classList.remove('border-active');
      }
    });
  }

  removeActiveAll(type: string) {
    // type: scene or tag
    document.querySelectorAll(`.${type}-item.active`).forEach(e => {
      e.classList.remove('active');
      e.classList.remove('border-active');
    });
  }

  onCreateNewScene() {
    if (this.enableBtnCreateNew) {
      const objNewScene = {
        name: DASHBOARD_EDIT_XML.SCENE_NAME_DEFAULT + Date.now(),
        color: ColorUtil.hexToRgb(DASHBOARD_EDIT_XML.SCENE_COLOR_DEFAULT),
        isNewScene: true
      };
      this.scenes.unshift(objNewScene);
      //this.editingAddNewSceneButton = true;
      this.videoEditXMLService.isAddNewScene = true;
      //this.videoEditXMLService.isEditingScene = true;
      // const newSceneAddedModel = new NewSceneAddedModel();
      // newSceneAddedModel.oldSceneName = objNewScene.name;
      // newSceneAddedModel.sceneName = objNewScene.name;
      // newSceneAddedModel.sceneColor = objNewScene.color;
      // newSceneAddedModel.isAddedFrom = EDIT_XML_ACTION.ADD_NEW_BY_LEFT_SIDE_BUTTON;
      // newSceneAddedModel.isUpdate = false;
      // newSceneAddedModel.placeEditingOn = EDIT_XML_ACTION.EDITING_ON_NEW_SCENE;
      // this.videoEditXMLService.obsNewScene.next(newSceneAddedModel);
    }
    // this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
    //   && this.isClickEditBtn
    //   && !this.editingAddNewSceneButton;
  }

  onRedrawNewScene() {
  }

  onEditXML(xml: any) {
    if (xml.id != this.xmlIdCurrent) {
      this.toggleDataActive(xml, true);
    }
    else {
      this.videoEditXMLService.isEditingSceneBar = false;
      this.videoEditXMLService.isEditingScene = false;
      this.videoEditXMLService.xmlId = xml.id;
      this.videoEditXMLService.xmlName = xml.name;
      this.isShowGanttChart = true;
      this.currentSceneName = '';
      if (xml.is_draft) {
        const param = {
          type: 'confirm',
          title: 'CONFIRM',
          message: messageConstant.XML_EDITING.HAVE_DRAFT
        };
        this.dialogService.confirm(param).subscribe(result => {
          if (result) {
            this.isModifying = true;
            this.videoEditXMLService.isDraft.next(true);
            this.onHandleBeforeCallMetadataXML(xml);
            this.retrieveGetXMLMetaDataEditVideo(xml);
            this.enableBtnLoadDraftXML = false;
            this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
              && this.isClickEditBtn
              && !this.editingAddNewSceneButton;
          }
          //
          else {
            this.enableBtnLoadDraftXML = true;
            this.dashboardService.syncOriginalXML(xml.id).subscribe(data => {
              this.onHandleBeforeCallMetadataXML(xml);
              this.retrieveGetXMLMetaDataEditVideo(xml);
              this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
                && this.isClickEditBtn
                && !this.editingAddNewSceneButton;
            }, (error) => {
            }); // Sync original xml
          }
        });
      }
      //NOT DRAFT
      else {
        const index = this.videoEditXMLService.listXMLValidated.findIndex(item => item === xml.id);
        if (index > -1) {
          this.videoEditXMLService.isDraft.next(false);
          this.onHandleBeforeCallMetadataXML(xml);
          this.retrieveGetXMLMetaDataEditVideo(xml);
          this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
            && this.isClickEditBtn
            && !this.editingAddNewSceneButton;
        } else {
          if (this.isEditXML && xml.id) {
            this.dashboardService.validateXMLEditVideo(xml.id, EDIT_XML_PATTERN.REGISTER).subscribe(data => {
              xml.is_draft = true;
              this.videoEditXMLService.isDraft.next(false);
              this.videoEditXMLService.listXMLValidated.push(xml.id);
              this.toggleDataActive(xml);
              this.onHandleBeforeCallMetadataXML(xml);
              this.retrieveGetXMLMetaDataEditVideo(xml);
              // this.isModifying = true;
              this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
                && this.isClickEditBtn
                && !this.editingAddNewSceneButton;
            }, (error) => {
              this.handleShowErrorValidate(error, xml);
            })
          }
          else {
            if (xml && xml.id) {
              this.videoEditXMLService.isDraft.next(false);
              this.toggleDataActive(xml);
              this.onHandleBeforeCallMetadataXML(xml);
              this.retrieveGetXMLMetaDataEditVideo(xml);

              this.enableBtnCreateNew = !this.videoEditXMLService.isEditingScene
                && this.isClickEditBtn
                && !this.editingAddNewSceneButton;
            }; // Generate token and validate xml
          }
        }
      }
    }
  }

  private onHandleBeforeCallMetadataXML(xml: any) {
    this.videoEditXMLService.currentBtnEditIsClickedID.next(xml.id);
    if (!this.isClickEditBtn) {
      this.onUpdateStatusBtnEditXML(xml.id, EDIT_XML_ACTION.CLICK_BUTTON_EDIT);
      this.isClickEditBtn = true;
      this.outEditXMLById.emit(xml.id);
    }
  }

  onUpdateStatusBtnEditXML(xmlId: number, actionType: string) {
    if (this.isEditXML) {
      switch (actionType) {
        case EDIT_XML_ACTION.CLICK_BUTTON_EDIT:
          document.getElementById('editBtn-' + xmlId).style.display = 'none';
          document.getElementById('deleteBtn-' + xmlId).style.display = 'none';
          document.getElementById('saveBtn-' + xmlId).style.display = 'inline';
          // document.getElementById('draftBtn-' + xmlId).style.display = 'inline';
          break;
      }
    }
  }

  onResetButtonsEditXML(xmlIdCurrent: number) {
    if (xmlIdCurrent >= 0) {
      document.getElementById('editBtn-' + xmlIdCurrent).style.display = 'block';
      document.getElementById('deleteBtn-' + xmlIdCurrent).style.display = 'block';
      document.getElementById('saveBtn-' + xmlIdCurrent).style.display = 'none';
      //document.getElementById('draftBtn-' + xmlIdCurrent).style.display = 'none';
    }
  }


  onRightClick(event: MouseEvent, sceneName) {
    event.preventDefault();
    this.menuRightClickScenePosition.x = event.clientX + 'px';
    this.menuRightClickScenePosition.y = event.clientY + 'px';
    this.matMenuTrigger.toArray()[0].menuData = { sceneName };
    this.matMenuTrigger.toArray()[0].openMenu();
    // Todo handler hard code index array matMenuTrigger.
  }

  onDeleteScene(sceneName: string) {
    if (!this.videoEditXMLService.isAddNewScene) {
      if (sceneName) {
        const param = {
          type: 'confirm',
          title: 'CONFIRM',
          message: messageConstant.SCENE.CONFIRM_DELETE
        };
        this.dialogService.confirm(param).subscribe(result => {
          if (result) {
            this.videoEditXMLService.onDeleteScene(sceneName);
            this.currentSceneName = '';
            this.editingAddNewSceneButton = false;
            this.enableBtnCreateNew = true;
          }
        });
      }
    } else {
      if (sceneName) {
        const param = {
          type: 'info',
          title: 'CONFIRM',
          message: messageConstant.SCENE.NOT_SAVED_YET
        };
        this.dialogService.info(param);
      }
    }

  }

  onChoseSaveType(event: any, xmlId) {
    if (this.videoEditXMLService.isDraft.value) {
      this.menuLeftClickSavePosition.x = event.clientX + 'px';
      this.menuLeftClickSavePosition.y = event.clientY + 'px';
      this.matMenuTrigger.toArray()[1].menuData = { xmlId };
      this.matMenuTrigger.toArray()[1].openMenu();
      // Todo handler hard code index array matMenuTrigger.
    }
  }

  private onSaveXML(xmlId: number, savePattern: number, newNameXML = '') {
    if (this.isShowBtnSave) {
      // 1. Get token to save
      this.spinnerService.show();
      const param = {
        type: 'validationOnSaveXML',
        title: 'EDIT XML',
        message: messageConstant.XML_EDITING.SAVE_AFTERANOTHER
      };


      this.dashboardService.validateXMLEditVideo(xmlId, savePattern).subscribe(respToken => {
        if (respToken && respToken.token) {
          const objSaveRequest = {
            token: respToken.token,
            xml_editor_pattern: savePattern,
            xml_id: xmlId,
            xml_name: undefined
          };
          if (savePattern === EDIT_XML_PATTERN.SAVE_AS) {
            objSaveRequest.xml_name = newNameXML;
          }

          if (respToken.version > 1 && savePattern !== EDIT_XML_PATTERN.SAVE_AS) {
            this.spinnerService.hide();
            this.dialogService.validationOnSaveXML(param).subscribe(result => {
              if (!result) {
                this.onSaveAsXML(xmlId);
              }
              else {
                this.spinnerService.show();
                this.dashboardService.onSaveXMLEditVideo(objSaveRequest).subscribe(respSave => {
                  if (respSave) {
                    this.videoEditXMLService.isDraft.next(false);
                    this.videoEditXMLService.obsActionStatus.next(new ActionStatus(true, false, false));
                    this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, false, false, false));
                    this.listXML.forEach(item => {
                      if (item.id === xmlId) {
                        item.is_draft = false;
                        const index = this.videoEditXMLService.listXMLValidated.findIndex(id => id === xmlId);
                        if (index > -1) {
                          this.videoEditXMLService.listXMLValidated.splice(index, 1);
                          if (savePattern !== EDIT_XML_PATTERN.SAVE_AS) {
                            this.isClickEditBtn = false;
                            this.enableBtnCreateNew = true;
                            item.select = false;
                            this.onResetButtonsEditXML(item.id);
                            this.dataClick.emit({ choose: false, id: item.id });
                            // this.onEditXML(item);
                          }
                        }
                        return;
                      }
                    });
                    this.isModifying = false;
                    this.spinnerService.hide();
                    this.toast.success(messageConstant.XML_EDITING.SAVE_SUCCESS);
                    if (savePattern === EDIT_XML_PATTERN.SAVE_AS) {
                      this.videoEditXMLService.reloadXMLList.next(newNameXML);
                    }

                  }
                }, error => {
                  this.spinnerService.hide();
                  this.toast.error(messageConstant.XML_EDITING.SAVE_FAILED);
                });
              }
            });
          }
          else {
            this.dashboardService.onSaveXMLEditVideo(objSaveRequest).subscribe(respSave => {
              if (respSave) {
                this.videoEditXMLService.isDraft.next(false);
                this.videoEditXMLService.obsActionStatus.next(new ActionStatus(true, false, false));
                this.videoEditXMLService.executeEditXML.next(new ControlBarStatus(false, false, false, false, false));
                this.listXML.forEach(item => {
                  if (item.id === xmlId) {
                    item.is_draft = false;
                    const index = this.videoEditXMLService.listXMLValidated.findIndex(id => id === xmlId);
                    if (index > -1) {
                      this.videoEditXMLService.listXMLValidated.splice(index, 1);
                      this.isClickEditBtn = false;
                      this.enableBtnCreateNew = false;
                      this.xmlIdCurrent = -1;
                      item.select = false;
                      this.onResetButtonsEditXML(item.id);
                      this.dataClick.emit({ isRemoveAllXML: true, id: item.id });
                      // this.onEditXML(item);
                    }
                    return;
                  }
                });
                this.isModifying = false;
                this.spinnerService.hide();
                this.toast.success(messageConstant.XML_EDITING.SAVE_SUCCESS);
                if (savePattern === EDIT_XML_PATTERN.SAVE_AS) {
                  this.videoEditXMLService.reloadXMLList.next(newNameXML);
                }

              }
            }, error => {
              this.spinnerService.hide();
              this.toast.error(messageConstant.XML_EDITING.SAVE_FAILED);
            });
          }
        }
      }, (error) => {
        this.spinnerService.hide();
        const dataXml = this.listXML.filter(item => item.id === xmlId);
        this.handleShowErrorValidate(error, dataXml && dataXml[0]);
      })
      this.enableBtnLoadDraftXML = false;
    }
  }

  onSaveOverrideXML(xmlId: number) {
    this.onSaveXML(xmlId, EDIT_XML_PATTERN.SAVE_OVERRIDE);
  }

  onSaveAsXML(xmlId: number) {
    const dialogRef = this.dialog.open(PopupSaveAsXmlComponent, {
      width: '40%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(newNameXML => {
      if (newNameXML) {
        this.onSaveXML(xmlId, EDIT_XML_PATTERN.SAVE_AS, newNameXML);
      }
    });
  }

  private reRenderUI() {
    setTimeout(() => {
      // const element = document.getElementById('sceneId-' + this.sceneCurrentId);
      let element: any;
      const elementsByClassName = document.getElementsByClassName('scene-item-edit-xml');
      Array.prototype.forEach.call(elementsByClassName, item => {
        if (item.textContent.trim() === this.videoEditXMLService.objSceneClicked.sceneName) {
          element = item;
          return;
        }
      });
      if (element && !!element.id) {
        const idString = element.id.split('-');
        const id = (idString.length > 0) ? idString[1] : -1;
        if (id > -1) {
          this.handleSceneClick(element, this.videoEditXMLService.objSceneClicked.sceneName, id);
          this.isReRender = false;
          this.classListSceneClicked = '';
          return;
        }
      }
    }, 500);
  }

  onCreateNewLabel() {
    const param = {
      type: 'addNewLable',
      title: 'Add new label',
    };
    this.dialogService.addNewLable(param).subscribe(result => {
      if (result) {
        const data = {
          video_set_id: this.videoID,
          xml_name: result
        }
        this.spinnerService.show();
        this.dashboardService.createNewLabel(data).subscribe(res => {
          if (res) {
            this.onReLoadXml.emit();
            this.spinnerService.hide();
          }
        })
      }
    })
  }

  onDeleteXML(xml) {
    if (xml && xml.owner_drafts && xml.owner_drafts.length > 0) {
      console.log('xml?.owner_drafts', xml.owner_drafts)
      const param = {
        type: 'confirm',
        title: 'Delete XML',
        message: `${xml.owner_drafts[0].full_name} has one draft for this original. Do you want to delete anyway?`,
      }
      this.dialogService.confirm(param).subscribe(result => {
        if (result) {
          const data = {
            video_set_id: this.videoID,
            xml_id: xml.id
          }
          this.spinnerService.show();
          this.handleDeleteXml(data, xml);
        }
      });

    } else {
      const param = {
        type: 'delete',
        title: 'Delete XML',
        message: `Are you sure to delete ${xml.name}?`,
      }
      this.dialogService.delete(param).subscribe(result => {
        if (result) {
          const data = {
            video_set_id: this.videoID,
            xml_id: xml.id
          }
          this.spinnerService.show();
          this.handleDeleteXml(data, xml);
        }
      });
    }
  }

  private handleDeleteXml(data: any, xml: any) {
    this.dashboardService.deleteXml(data).subscribe(res => {
      if (res) {
        this.onReLoadXml.emit();
        this.spinnerService.hide();
      }
    }, (err) => {
      this.spinnerService.hide();
      if (err.hasOwnProperty('status') && JSON.stringify(err.status) === HTTP_STATUS_CODE.BAD_REQUEST) {
        const messageCode = err.error.message.substr(0, err.error.message.indexOf(':'));
        switch (messageCode) {
          case VIDEO_MANAGEMENT_RESPONSE.CODE.VIDEO_MANAGEMENT_05:
            const paramErr = {
              type: 'info',
              title: 'Notification',
              message: xml.name + ' ' + VIDEO_MANAGEMENT_RESPONSE.MESSAGE.VIDEO_MANAGEMENT_05,
            }
            this.dialogService.info(paramErr).subscribe(result => {
              this.onReLoadXml.emit();
            });
            break;
        }
      }
    });
  }

  private handleShowErrorValidate(error: any, xml: any) {
    if (error.hasOwnProperty('status') && JSON.stringify(error.status) === HTTP_STATUS_CODE.BAD_REQUEST) {
      const messageCode = error.error.message.substr(0, error.error.message.indexOf(':'));
      switch (messageCode) {
        case VIDEO_MANAGEMENT_RESPONSE.CODE.XML_EDITOR_53:
          const paramErr = {
            type: 'info',
            title: 'Notification',
            message: xml.name + ' ' + VIDEO_MANAGEMENT_RESPONSE.MESSAGE.XML_EDITOR_53,
          }
          this.dialogService.info(paramErr).subscribe(result => {
            this.onReLoadXml.emit();
          });
          break;
      }
    }
  }
}

