export class SceneBar {
  id: number;
  startTime: number;
  endTime: number;
  isOriginSceneBar: boolean;
  preLeft: number;
  subRight: number;
  tags: string[];
  index: number;
  idRecord: string;
}

export class SceneBarScaling {
  id: number;
  startTime: number;
  endTime: number;

  constructor(id: number, startTime: number, endTime: number) {
    this.id = id;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

export class NewSceneAddedModel {
  fromTime: string;
  toTime: string;
  oldSceneName: string;
  sceneName: string;
  sceneColor: string; // hex code
  isAddedFrom: string;
  isUpdate: boolean;
  sceneBars: SceneBar[] = [];
  sceneBarIdResponseFirst: number;
  placeEditingOn: number;

  onReset() {
    this.oldSceneName = '';
    this.sceneBars = [];
    this.sceneName = '';
    this.sceneColor = '';
    this.isAddedFrom = '';
    this.isUpdate = false;
    this.sceneBarIdResponseFirst = -1;
    this.fromTime = '00:00:00.00';
    this.toTime = '00:00:00.00';
  }
}

export class SaveDraftStatus {
  draftSavedNewSceneBarOfExistScene: boolean;
}

export class SceneBarClicked {
  id: number;
  startTime: number;
  endTime: number;
  tags: string[];
}

export class SceneClicked {
  oldSceneName: string;
  sceneName: string;
  oldSceneColor: string;
  sceneColor: string; // hex code
  sceneBars: SceneBar[] = [];
  recordSceneBars: SceneBar[] = [];
}

export class TypeOfSavingScene {
  isSaveNewScene: boolean;
  isSaveNewSceneBar: boolean;
  isUpdateOldScene: boolean;
  isUpdateOldSceneBar: boolean;

  constructor(saveNewScene: boolean, saveNewSceneBar: boolean, updateOldScene: boolean, updateOldSceneBar: boolean) {
    this.isSaveNewScene = saveNewScene;
    this.isSaveNewSceneBar = saveNewSceneBar;
    this.isUpdateOldScene = updateOldScene;
    this.isUpdateOldSceneBar = updateOldSceneBar;
  }
}

export class ActionStatus {
  letUpdateUIScene: boolean;
  letDisableDraftSaveOnEditScene: boolean;
  letShowEditScene: boolean;

  constructor(letUpdateUIScene: boolean,
    letDisableDraftSaveOnEditScene: boolean,
    letShowEditScene: boolean,
  ) {
    this.letUpdateUIScene = letUpdateUIScene;
    this.letDisableDraftSaveOnEditScene = letDisableDraftSaveOnEditScene;
    this.letShowEditScene = letShowEditScene;
  }
}

export class ControlBarStatus {

  isShowSaveButton: boolean;
  isShowRemoveAllButton: boolean;
  isEnablePlaySceneBarBtn: boolean;
  isEnablePauseSceneBarBtn: boolean;
  isEnableUndoSceneBarBtn: boolean;

  constructor(isShowSaveButton: boolean,
    isShowRemoveAllButton: boolean,
    isEnablePlaySceneBarBtn: boolean,
    isEnablePauseSceneBarBtn: boolean,
    isEnableUndoSceneBarBtn: boolean
  ) {
    this.isShowSaveButton = isShowSaveButton;
    this.isShowRemoveAllButton = isShowRemoveAllButton;
    this.isEnablePlaySceneBarBtn = isEnablePlaySceneBarBtn;
    this.isEnablePauseSceneBarBtn = isEnablePauseSceneBarBtn;
    this.isEnableUndoSceneBarBtn = isEnableUndoSceneBarBtn;
  }
}

export class EditingSceneBar {
  index: number;
  data: any;
  isEditing: boolean;

  constructor() {
    this.index = -1;
    this.data = null;
    this.isEditing = false;
  }
}
type label = Record<'group_name' | 'tag_name', string>;
export class SceneBarParams {
  xml_id: number;
  scene_bar_id: number;
  scene_bar_name: string;
  scene_bar_color: string;
  scene_bar_start: string;
  scene_bar_end: string;
  labels: label[];
}

export class SceneParams {
  current_scene_name: string;
  scene_name: string;
  xml_id: number;
  scene_color: string;
}

export class Tags {
  name: string;
  isNewTag: boolean;
  willBeDeleted:boolean;

  constructor(name: string, isNewTag: boolean, willBeDeleted:boolean) {
    this.name = name;
    this.isNewTag = isNewTag;
    this.willBeDeleted = willBeDeleted;
  }
}