export const messageConstant = {
  LOGIN: {
    LOGIN_FAIL: 'Your email or password incorrect! Please check again.'
  },
  FORGOT_PASSWORD: {
    FORGOT_SUCCESS: 'Your password has been reset. Please check your mail.',
    FORGOT_FAIL: 'Email is not exist.'
  },
  DOCUMENT: {
    TITLE_DELETE: 'Document Deletion',
    CONFIRM_DELETE: 'Are you sure delete document?',
    DELETE_SUCCESS: 'File deleted successfully',
    DELETE_FAILED: 'Delete file failed',
    FILE_IS_DELETED: 'Document does not exist'
  },
  UPLOAD: {
    FAILED: 'Upload failed', // fileName + '...'
    SUCCESS: 'Uploaded successfully',
    DELETE_SUCCESS: 'Deleted successfully',
    MODIFY_SUCCESS: 'Modified successfully',
    NODATA: 'No data available in table',
    NAME_ALREADY: 'Video title already exists',
    FILE_IS_DELETED: 'Video data does not exit',
    VIDEO_FORMAT_UNSUPPORTED: 'This video format is not supported'
  },
  DOWNLOAD: {
    FAILED: 'Download failed'
  },
  FILE: {
    VIDEO_EXTENSION_INVALID: 'Wrong format of video file. Video format must be: ',
    FILE_EXTENSION_INVALID: 'Wrong format of file. File format must be: ',
    NO_DATA: 'File has no data'
  },
  VALIDATOR: {
    SPECIAL_CHARACTER: `Title name can't contain any of the following characters: ( [ \\ { ^ } % \` ] > [ ~ < # | ] ) `
  },
  SYSTEM_MANAGEMENT: {
    USER_LIST_DELETE_SUCESS: 'Deleted successfully',
    USER_LIST_ADD_SUCESS: 'User added successfully',
    PROJECT_LIST_ADD_SUCCESS: 'Saved successfully',
    PROJECT_LIST_ADD_SAME_NAME_ERR: 'Project name already exists',
    UPDATE_SUCCESS: 'Updated successfully',
    UPDATE_FAIL: 'Update failed',
    DELETE_FAIL: 'Delete failed',
    DELETE_SUCCESS: 'Deleted successfully',
    FOLDER_LIST_DELETE_SUCCESS: 'Deleted successfully'
  },
  PROJECT_MANAGEMENT: {
    FOLDER_UPLOAD_SUCCESS: 'Saved successfully',
    PROJECT_UPDATE_EMPTY: 'Project name is empty',
    PROJECT_UPDATE_DUPLICATE: 'Project name already exists',
    PROJECT_UPDATE_SPECIAL_CHARACTER: 'Project name contain special characters',
    FOLDER_UPDATE_EMPTY: 'Folder name is empty',
    FOLDER_UPDATE_DUPLICATE: 'Folder name already exists',
    FOLDER_UPDATE_SPECIAL_CHARACTER: 'Folder name contain special characters',
    FOLDER_UPDATE_SUCCESS: 'Updated successfully'
  },
  USER_MANAGEMENT: {
    SPECIAL_CHARACTER: 'Name contains special characters',
    ADD_USER_ALREADY_EXIST: 'User add failed. Email is already exist',
    UPDATE_USER_SUCCESS: 'Updated successfully',
    UPDATE_USER_FAIL: 'Update failed',
    USERGROUP_SPECIAL_CHARACTER: 'Group name does not have special characters',
    USERGROUP_ADD_SUCCESS: 'Added user group successfully',
    USERGROUP_UPDATE_SUCCESS: 'Updated user group successfully',
    USERGROUP_EMPTY: 'Group name is empty',
    USERGROUP_DUPLICATE: 'Group name already exists',
    USERGROUP_DELETE_SUCCESS: 'Deleted successfully',
    USERGROUP_NOT_EXIST: 'Group name does not exist on system'
  },
  VIDEO_MANAGEMENT: {
    PROJECT_NOT_EXIST: 'Project does not exist'
  },
  AWS: {
    FILE_DOES_NOT_EXIST: 'File does not exist'
  },
  COPY_VIDEO: {
    COMMON_ERROR: 'Copy video failed',
    SUCCESS: 'Saved successfully'
  },
  FAIL_TO_GET: 'Fail to get data!',
  SCENE: {
    NOT_SAVED_YET: 'This scene has not been saved!',
    CONFIRM_DELETE: 'Are you sure delete scene?',
    DELETE_SUCCESS: 'Scene deleted successfully',
    UPDATE_SUCCESS: 'Scene updated successfully',
    ADD_NEW_SUCCESS: 'This scene save successfully',
    DELETE_FAILED: 'Delete scene failed',
    UPDATE_FAILED: 'Update scene failed',
    NAME_DUPLICATE: 'Scene name duplicate',
    ADD_NEW_FAILED: 'This scene save failed',
    NAME_NOT_BE_BLANK: 'Scene name not be blank'
  },
  SCENE_BAR: {
    CONFIRM_DELETE: 'Are you sure delete scene bar?',
    CONFIRM_NOT_SAVE: 'Changes your made may not be saved',
    DELETE_SUCCESS: 'Scene bar deleted successfully',
    DELETE_FAILED: 'Delete scene bar failed',
    UPDATE_FAILED: 'Update scene bar failed',
    UPDATE_SUCCESS: 'Update scene bar successfully',
    ADD_NEW_FAILED: 'Add a new scene bar failed',
    ADD_NEW_SUCCESS: 'Add a new scene bar successfully',
    ADD_MULTIPLE_NEW_FAILED: 'Add new scene bars failed',
    TIME_OVERLAP: 'Scene bar data with start-end overlap'
  },
  XML_EDITING: {
    MUST_SAVE_SCENE: 'You must save this new scene!',
    DO_NOT_SAVE: 'Your edit contents will not be saved ?',
    HAVE_DRAFT: 'There is a draft file do you want restore your action ?',
    SAVE_SUCCESS: 'File saved successfully',
    SAVE_DRAFT_SUCCESS: 'Saving a draft successfully',
    SAVE_DRAFT_FAILED: 'Saving a draft failed',
    SAVE_FAILED: 'File save failed',
    DELETE_SUCCESS: 'File deleted successfully',
    DELETE_FAILED: 'File deleted failed',
    SAVE_AFTERANOTHER: 'Another user have changed original version.\n If you save then system will delete changed version.'

  },
  EXPORT_DATA: {
    EXPORT_NO_DATA: 'There is no data to export',
    EXPORT_FAILED: 'An error has occurred. Please contact the administrator',
  },
  DASHBOARD_CUTTING_VIDEO: {
    SAVE_SUCCESS: 'Saved successfully',
    SAVE_FAILED: 'Save failed'
  }
};

export const UIPATH = {
  LOGIN: 'login',
  OAUTH: 'oauth',
  DASHBOARD: 'dashboard',
  VIDEO_MANAGEMENT: 'management',
  SYSTEM_MANAGEMENT: 'sysmanagement',
  REPORTING: 'reporting',
  VIDEO_EDITOR: 'video-editor',
  USER_MANAGEMENT: 'usermanagement',
};
export const NAVIGATE = {
  LOGIN: 'login',
  OAUTH: 'oauth',
  DASHBOARD: 'dashboard',
  VIDEO_MANAGEMENT: 'video-management',
  SYSTEM_MANAGEMENT: 'system-management',
  REPORTING: 'report',
  VIDEO_EDITOR: 'video-editor',
  USER_MANAGEMENT: 'usermanagement',
  DASHBOARD_EDIT: 'dashboard/edit/XML'
};


export const apiPathConstant = {
  authController: {
    LOGIN: `${UIPATH.OAUTH}/token`,
    LOGOUT: `${UIPATH.OAUTH}/logout`,
    FORGOT_PASSWORD: `${UIPATH.OAUTH}/forgot`,
    REFRESH_TOKEN: `${UIPATH.OAUTH}/token/refresh`
  },
  dashboardController: {
    UIPATH: `${UIPATH.DASHBOARD}`,
    REPLY: `${UIPATH.DASHBOARD}/reply`,
    COMMENT: `${UIPATH.DASHBOARD}/comment`,
    XML_DATA: `${UIPATH.DASHBOARD}/xmlData`,
    META_DATA: `${UIPATH.DASHBOARD}/metaData`,
    VIDEO_DATA: `${UIPATH.DASHBOARD}/videoData`,
    PUSHER_AUTH: `${UIPATH.DASHBOARD}/pusher/auth`,
    TIMESERIES_DATA: `${UIPATH.DASHBOARD}/timeSeriesData`,
    TIMESERIES_META_DATA: `${UIPATH.DASHBOARD}/timeSeriesDetail`
  },
  managementController: {
    // Video-management
    FOLDER: `${UIPATH.VIDEO_MANAGEMENT}/folder`,
    PROJECT: `${UIPATH.VIDEO_MANAGEMENT}/project`,
    XML_DATA: `${UIPATH.VIDEO_MANAGEMENT}/xmlData`,
    VIDEO_DATA: `${UIPATH.VIDEO_MANAGEMENT}/videoData`,
    VIDEO_DETAIL: `${UIPATH.VIDEO_MANAGEMENT}/videoDetail`,
    DOCUMENT_DATA: `${UIPATH.VIDEO_MANAGEMENT}/documentData`,
    VIDEO_DETAIL_BY_ID: `${UIPATH.VIDEO_MANAGEMENT}/videoDetailById`,
    VIDEO_DETAIL_BY_FOLDER: `${UIPATH.VIDEO_MANAGEMENT}/videoDetailByFolder`,
    // Copy pop-up
    COPY: `${UIPATH.VIDEO_MANAGEMENT}/copy`,
    COPY_BY_FOLDER: `${UIPATH.VIDEO_MANAGEMENT}/copy/folder`,
    COPY_BY_VIDEO_SET: `${UIPATH.VIDEO_MANAGEMENT}/copy/video-set`,
    COPY_BY_INDIVIDUAL: `${UIPATH.VIDEO_MANAGEMENT}/copy/individual`,
    // Export raw-data pop-up
    EXPORT_RAW_DATA: `${UIPATH.VIDEO_MANAGEMENT}/export/xml`, // EXPORT_RAW_DATA_01
    EXPORT_RAW_DATA_BY_FOLDER: `${UIPATH.VIDEO_MANAGEMENT}/export/folder`, // EXPORT_RAW_DATA_02
    EXPORT_RAW_DATA_BY_VIDEO_SET: `${UIPATH.VIDEO_MANAGEMENT}/export/video-set`, // EXPORT_RAW_DATA_03
    EXPORT_RAW_DATA_PUSHER_CHANNEL: `${UIPATH.VIDEO_MANAGEMENT}/export/pusher/xml/channel`, // EXPORT_RAW_DATA_04
    EXPORT_RAW_DATA_PUSHER_AUTH: `${UIPATH.VIDEO_MANAGEMENT}/export/pusher/xml`, // EXPORT_RAW_DATA_05

  },
  systemManagementController: {
    USER: `${UIPATH.SYSTEM_MANAGEMENT}/user`,
    FOLDER: `${UIPATH.SYSTEM_MANAGEMENT}/folder`,
    PROJECT: `${UIPATH.SYSTEM_MANAGEMENT}/project`,
    PROJECT_BUCKET: `${UIPATH.SYSTEM_MANAGEMENT}/project/bucket`,
    USERGROUP: `${UIPATH.SYSTEM_MANAGEMENT}/userGroup`,
    USERGROUP_ALL: `${UIPATH.SYSTEM_MANAGEMENT}/userGroup/all`,
    USERGROUP_ASSIGN: `${UIPATH.SYSTEM_MANAGEMENT}/userGroup/assign`,
    USERGROUPAVAIABLE: `${UIPATH.SYSTEM_MANAGEMENT}/groupAvailable`,
  },
  userManagementController: {
    USER: `${UIPATH.USER_MANAGEMENT}/user`,
    ROLE: `${UIPATH.USER_MANAGEMENT}/role`,
    USERAVAIABLE: `${UIPATH.SYSTEM_MANAGEMENT}/userAvailable`
  },
  logManagementController: {
    ACTIVITY_LOGGING_PUSHER_CHANNEL: `${UIPATH.SYSTEM_MANAGEMENT}/export/pusher/activity-logging/channel`,
    EXPORT_ACTIVITY_LOGGING_PUSHER_AUTH: `${UIPATH.SYSTEM_MANAGEMENT}/export/pusher/activity-logging`,
    ACTIVITY_LOGGING_STOGARE: `${UIPATH.SYSTEM_MANAGEMENT}/activity-logging/manual`,
    EXPORT_LOGGING: `${UIPATH.SYSTEM_MANAGEMENT}/activity-logging`
  },
  reportManagementController: {
    // Searching reporting
    PROJECT: `${UIPATH.REPORTING}/project`, // REPORT_01
    FOLDER: `${UIPATH.REPORTING}/folder`, // REPORT_02
    VIDEO: `${UIPATH.REPORTING}/videoDetail`, // REPORT_03
    SCENETAG: `${UIPATH.REPORTING}/sceneTag`, // REPORT_04
    REPORTING: `${UIPATH.REPORTING}`, // REPORT_05
    // Preview reporting
    VIDEO_DETAILS: `${UIPATH.REPORTING}/videoDetails`, // REPORT_06
    META_DATA: `${UIPATH.REPORTING}/metaData`, // REPORT_07
    TIMESERIES_DATA: `${UIPATH.REPORTING}/timeSeriesData`, // REPORT_08
    TIMESERIES_META_DATA: `${UIPATH.REPORTING}/timeSeriesDetail`, // REPORT_09
    VIDEO_DATA: `${UIPATH.REPORTING}/videoData`, // REPORT_10
    XML_DATA: `${UIPATH.REPORTING}/xmlData`, // REPORT_11
    // Export reporting
    EXPORT_REPORTING: `${UIPATH.REPORTING}/export`, // EXPORT_REPORTING_DATA_01
    EXPORT_REPORTING_PUSHER_CHANNEL: `${UIPATH.REPORTING}/export/pusher/report/channel`, // EXPORT_REPORTING_DATA_02
    EXPORT_REPORTING_PUSHER_AUTH: `${UIPATH.REPORTING}/export/pusher/report`, // EXPORT_REPORTING_DATA_03
    EXPORT_REPORTING_VALIDATE: `${UIPATH.REPORTING}/export/validate`
  },
  videoEditorDashboard: {
    VIDEO_DATA: `${UIPATH.VIDEO_EDITOR}/video`,
    XML_DATA: `${UIPATH.VIDEO_EDITOR}/xml`,
    META_DATA: `${UIPATH.VIDEO_EDITOR}/xml/meta-data`,
    XML_VALIDATE: `${UIPATH.VIDEO_EDITOR}/xml/validate`,
    XML_SYNC_ORIGINAL: `${UIPATH.VIDEO_EDITOR}/xml/sync`,
    XML_SAVE: `${UIPATH.VIDEO_EDITOR}/xml/save`,
    SCENE: `${UIPATH.VIDEO_EDITOR}/scene`,
    SCENE_BAR: `${UIPATH.VIDEO_EDITOR}/scene-bar`,
    SCENE_BARS: `${UIPATH.VIDEO_EDITOR}/scene-bars`,
    TAGS_COLORS_Of_XML: `${UIPATH.VIDEO_EDITOR}/xml/group-tag`,
  }
};

export enum userPrivileges {
  NONE = 0,
  VIEWER,
  EDITOR,
  ALL // Admin
}

export const userManagementRoleContants = {
  USER_ROLE_ADMIN: 'ROLE_ADMIN',
  USER_ROLE_USER: 'ROLE_USER'
}

export enum userPolicies {
  NONE = 0,
  MINIMUM,
  STANDARD,
  UPLOADER,
  PRO,
  DATA_DL,
  XML_EDIT
}

export const headerPolicies = {
  DATA_DL: userPolicies.DATA_DL,
  XML_EDIT: userPolicies.XML_EDIT
}

export const ErrorCodeConstant = {
  NAME_ALREADY: 'ERROR-1',
  NAME_EMPTY: 'ERROR-2',
  NAME_SPECIAL: 'ERROR-3',
  ADD_SCENE_DUPLICATE: 'XML-EDITOR-03',
  ADD_SCENE_BAR_OVERLAP: 'XML-EDITOR-13',
};

export const ErrorAWS = {
  NOT_FOUND: 'NotFound'
};

export const chartReplacePair = {
  '~': '\\~',
  '`': '\\`',
  '!': '\\!',
  '@': '\\@',
  '#': '\\#',
  // tslint:disable-next-line:object-literal-key-quotes
  $: '\\$',
  '%': '\\%',
  '^': '\\^',
  '&': '\\&',
  '*': '\\*',
  '(': '\\(',
  ')': '\\)',
  '+': '\\+',
  '=': '\\=',
  '{': '\\{',
  '}': '\\}',
  '|': '\\|',
  '/': '\\/',
  '"': '\\"',
  '\\': '\\\\',
  '>': '\\>',
  '<': '\\<',
  '?': '\\?',
  '.': '\\.',
  ',': '\\,',
  ':': '\\:',
  '[': '\\[',
  ']': '\\]'
};

export const stringPattern = '[\\\\\\~`\\!@#\\$%\\^&\\*\\(\\)\\+\\=\\{\\}\\|\\/"><\\?\\.\\,\\[\\]]';

export const localTimeZoneByCode = {
  JST: 'Asia/Tokyo'
  // more...
};

export const sortingContant = {
  NEWEST: 'Newest - Oldest',
  OLDEST: 'Oldest - Newest',
  A_Z: 'A - Z',
  Z_A: 'Z - A'
};

export const copyPatternConstant = {
  ALL_FOLDER: 'All Folder',
  VIDEO_SET: 'Video Set',
  INDIVIDUAL_VIDEO: 'Individual Video/Data'
};

export const exportPatternConstant = {
  ALL_FOLDER: 'All Folder',
  VIDEO_SET: 'Video Set',
};

export const timeConstant = {
  FORMAT_ONE: 'Format: ss.fff (ex: 58.735)',
  FORMAT_TWO: 'Format: hh:mm:ss (ex: 00:05:15)',
};

export const aggregationConstant = {
  ONE_FILE: 'One file',
  EACH_FOLDER: 'One file for each folder',
  VIDEO_SET: 'One file for each video set'
}

export const fileTypeConstant = {
  BOTH_AS_BELOW: 'Both as below',
  SCENE_TAG: 'Scenes as tags',
  COMMENT: 'Comments'
}

export const copyChooseDataConstant = {
  VIDEO_LIST: 'Video list',
  XML_LIST: 'XML list',
  MEASURE_DATA_LIST: 'Measure data list'
};

export const copyVideoTypeConstant = {
  ALIAS: 'Alias',
  PHYSIC: 'Physical'
};

export const baseRoleContant = {
  MINIMUM: 'minimum',
  STANDARD: 'standard',
  UPLOADER: 'uploader',
  PRO: 'pro'
};

export const baseRoleCheckboxContant = {
  DATADL: 'data-dl',
  XMLEDIT: 'xml-edit',
};

export const baseRoleTextCheckboxContant = {
  DATADL: 'dataDl',
  XMLEDIT: 'xmlEdit',
};

export enum SORTING {
  GET_FOLDER_IN_VIDEO_SET = -1,
  NEWEST = 0,
  OLDEST = 1,
  A_Z = 2,
  Z_A = 3
}

export enum COPY_PATTERN {
  ALL_FOLDER = 1,
  VIDEO_SET = 2,
  INDIVIDUAL_VIDEO = 3
}

export enum EXPORT_PATTERN {
  ALL_FOLDER = 1,
  VIDEO_SET = 2
}

export enum TIME_PATTERN {
  FORMAT_ONE = 1,
  FORMAT_TWO = 2
}

export enum AGGREGATION_PATTERN {
  ONE_FILE = 1,
  EACH_FOLDER = 2,
  VIDEO_SET = 3
}

export enum FILE_TYPE_PATTERN {
  BOTH_AS_BELOW = 1,
  SCENE_TAG = 2,
  COMMENT = 3
}

export enum COPY_VIDEO_TYPE {
  ALIAS = 1,
  PHYSIC
}

export enum CHOOSE_DATA_PATTERN {
  VIDEO_LIST = 1,
  XML_LIST,
  MEASURE_DATA_LIST
}

export enum BASEROLE {
  MINIMUM = 1,
  STANDARD = 2,
  UPLOADER = 3,
  PRO = 4
}

export enum BASEROLE_CHECKBOX {
  DATADL = 5,
  XMLEDIT = 6
}

export const copyVideoOptions = [
  {
    key: COPY_VIDEO_TYPE.ALIAS.valueOf(),
    value: copyVideoTypeConstant.ALIAS,
    checked: true
  },
  {
    key: COPY_VIDEO_TYPE.PHYSIC.valueOf(),
    value: copyVideoTypeConstant.PHYSIC,
    checked: false
  }
];

export const sortingOptions = [
  {
    key: SORTING.NEWEST,
    value: sortingContant.NEWEST
  },
  {
    key: SORTING.OLDEST,
    value: sortingContant.OLDEST
  },
  {
    key: SORTING.A_Z,
    value: sortingContant.A_Z
  },
  {
    key: SORTING.Z_A,
    value: sortingContant.Z_A
  }
];

export const copyPatternOptions = [
  {
    key: COPY_PATTERN.ALL_FOLDER,
    value: copyPatternConstant.ALL_FOLDER,
    checked: true
  },
  {
    key: COPY_PATTERN.VIDEO_SET,
    value: copyPatternConstant.VIDEO_SET,
    checked: false
  },
  {
    key: COPY_PATTERN.INDIVIDUAL_VIDEO,
    value: copyPatternConstant.INDIVIDUAL_VIDEO,
    checked: false
  }
];

export const exportPatternOptions = [
  {
    key: EXPORT_PATTERN.ALL_FOLDER,
    value: exportPatternConstant.ALL_FOLDER,
    checked: true
  },
  {
    key: EXPORT_PATTERN.VIDEO_SET,
    value: exportPatternConstant.VIDEO_SET,
    checked: false
  },
];

export const timeOptions = [
  {
    key: TIME_PATTERN.FORMAT_ONE,
    value: timeConstant.FORMAT_ONE,
    checked: true
  },
  {
    key: TIME_PATTERN.FORMAT_TWO,
    value: timeConstant.FORMAT_TWO,
    checked: false
  },
];

export const aggregationOptions = [
  {
    key: AGGREGATION_PATTERN.ONE_FILE,
    value: aggregationConstant.ONE_FILE,
    checked: true
  },
  {
    key: AGGREGATION_PATTERN.EACH_FOLDER,
    value: aggregationConstant.EACH_FOLDER,
    checked: false
  },
  {
    key: AGGREGATION_PATTERN.VIDEO_SET,
    value: aggregationConstant.VIDEO_SET,
    checked: false
  },
];

export const fileTypeOptions = [
  {
    key: FILE_TYPE_PATTERN.BOTH_AS_BELOW,
    value: fileTypeConstant.BOTH_AS_BELOW,
    checked: true
  },
  {
    key: FILE_TYPE_PATTERN.SCENE_TAG,
    value: fileTypeConstant.SCENE_TAG,
    checked: false
  },
  {
    key: FILE_TYPE_PATTERN.COMMENT,
    value: fileTypeConstant.COMMENT,
    checked: false
  },
];

export const chooseDataPatternOptions = [
  {
    key: CHOOSE_DATA_PATTERN.VIDEO_LIST,
    value: copyChooseDataConstant.VIDEO_LIST,
    isAllSelect: false,
    disabled: true
  },
  {
    key: CHOOSE_DATA_PATTERN.XML_LIST,
    value: copyChooseDataConstant.XML_LIST,
    isAllSelect: false,
    disabled: true
  },
  {
    key: CHOOSE_DATA_PATTERN.MEASURE_DATA_LIST,
    value: copyChooseDataConstant.MEASURE_DATA_LIST,
    isAllSelect: false,
    disabled: true
  }
];

export const ZOOM_OPTIONS = {
  MIN_ZOOM: 0.05, // n must be found in: MIN_ZOOM + n * STEP_ZOOM = 1
  MAX_ZOOM: 20, // MAX_ZOOM must be equal MIN_ZOOM + n * STEP_ZOOM
  STEP_ZOOM: 0.05
};

export const DASHBOARD_EDIT_XML = {
  SCENE_NAME_DEFAULT: 'New scene_',
  SCENE_COLOR_DEFAULT: '#0000FF',
  TIME_START_ADD_NEW_DEFAULT: '10'
};

export const EDIT_XML_ACTION = {
  CLICK_SCENE: 'click_scene',
  CLICK_SCENE_BAR: 'click_scene_bar',
  CLICK_BUTTON_EDIT: 'click_btn_edit',
  CLICK_BUTTON_SAVE: 'click_btn_save',
  CLICK_BUTTON_DRAFT: 'click_btn_draft',
  ADD_NEW_BY_LEFT_SIDE_BUTTON: 'from_left_side_button',
  ADD_NEW_BY_TIMELINE_BUTTON_ON_CONTROL: 'from_left_side_button',
  EDITING_ON_EXIST_SCENE: 1,
  EDITING_ON_NEW_SCENE: 2,
};

export const EDIT_XML_PATTERN = {
  REGISTER: 1,
  SAVE_OVERRIDE: 2,
  SAVE_AS: 3,
  DELETE_DRAFT_XML: 4
};

export const PUSHER_MESSAGE = {
  PUSHER_COMMENT_CREATED: 'create_comment_message',
  PUSHER_COMMENT_UPDATED: 'update_comment_message',
  PUSHER_COMMENT_DELETED: 'delete_comment_message',
  PUSHER_REPLY_CREATED: 'create_reply_message',
  PUSHER_REPLY_UPDATED: 'update_reply_message',
  PUSHER_REPLY_DELETED: 'delete_reply_message'
};

export const PUSHER_EVENT = {
  COMMENT_CREATED: 'create_comment',
  COMMENT_UPDATED: 'update_comment',
  COMMENT_DELETED: 'delete_comment',
  REPLY_CREATED: 'create_reply',
  REPLY_UPDATED: 'update_reply',
  REPLY_DELETED: 'delete_reply',
  EXPORT_RAW_DATA: 'export_raw_data',
  EXPORT_REPORTING: 'export_reporting',
  EXPORT_ACTIVITY_LOGGING: 'export_activity_logging',
  SUBSCRIPTION_SUCCEEDED: 'pusher:subscription_succeeded',
  SUBSCRIPTION_ERROR: 'pusher:subscription_error'
};

export const EXPORT = {
  FILE_NAME: 'file-download',
  CSV_FORMAT: 'csv',
  XLSX_FORMAT: 'xlsx'
};

export const EDIT_XML_TYPE = {
  SCENE: 1,
  SCENE_BAR: 2
};

export const EXPORT_CSV_RESPONSE = {
  CODE: {
    EXPORT_CSV_05: 'EXPORT-CSV-05',
    EXPORT_CSV_06: 'EXPORT-CSV-06'
  },
  MESSAGE: {
    FOLDER_NO_DATA: 'Folder have no data',
    VIDEO_SETS_NO_DATA: 'Video set have no data',
    FAILED: 'System error! Please contact admin'
  }
}

export const REPORTING_RESPONSE = {
  CODE: {
    REPORTING_01: 'REPORTING-01',
    REPORTING_02: 'REPORTING-02',
    REPORTING_03: 'REPORTING-03',
    EXPORT_REPORTING_01: 'EXPORT-REPORTING-01',
    EXPORT_REPORTING_10: 'EXPORT-REPORTING-10'
  },
  MESSAGE: {
    REPORTING_01: 'You can view 10 video set report one time !',
    REPORTING_02: 'Video-set have not found',
    REPORTING_03: 'Video-set have no XML data',
    EXPORT_REPORTING_01: 'You can export 10 video set one time !',
    EXPORT_REPORTING_10: 'System error! Please contact admin.'
  }
}

export const ACTIVITY_LOGGING_RESPONSE = {
  CODE: {
    ACTIVITY_LOG_01: 'ACTIVITY-LOG-01',
    ACTIVITY_LOG_02: 'ACTIVITY-LOG-02',
    ACTIVITY_LOG_10: 'ACTIVITY-LOG-10',
    ACTIVITY_LOG_11: 'ACTIVITY-LOG-11',
    ACTIVITY_LOG_12: 'ACTIVITY-LOG-12'
  },
  MESSAGE: {
    ACTIVITY_LOG_01: 'System error! Please contact admin',
    ACTIVITY_LOG_02: 'Activity Log have no data available',
    ACTIVITY_LOG_10: 'Activity Log with start_date same end_date. Please check again',
    ACTIVITY_LOG_11: 'Activity Log with start_date over end_date. Please check again',
    ACTIVITY_LOG_12: 'System error! Please contact admin'
  }
};
export const SYSTEM_MANAGEMENT_RESPONSE = {
  CODE: {
    SYSTEM_MANAGEMENT_01: 'SYSTEM-MANAGEMENT-01',
    SYSTEM_MANAGEMENT_02: 'SYSTEM-MANAGEMENT-02'
  },
  MESSAGE: {
    SYSTEM_MANAGEMENT_01: 'Folder cannot be empty. Please contact admin',
    SYSTEM_MANAGEMENT_02: 'All user group cannot be [NONE]. Please contact admin'
  }
};

export const VIDEO_MANAGEMENT_RESPONSE = {
  CODE: {
    VIDEO_MANAGEMENT_05: 'VIDEO-MANAGEMENT-05',
    XML_EDITOR_53: 'XML-EDITOR-53',
  },
  MESSAGE: {
    VIDEO_MANAGEMENT_05: 'not found',
    XML_EDITOR_53: 'not found',
  }
}

export const HTTP_STATUS_CODE = {
  BAD_REQUEST: '400',
  SUCCESS: '200'
};

export const baseRoleOptions = [
  {
    key: BASEROLE.MINIMUM,
    value: baseRoleContant.MINIMUM
  },
  {
    key: BASEROLE.STANDARD,
    value: baseRoleContant.STANDARD
  },
  {
    key: BASEROLE.UPLOADER,
    value: baseRoleContant.UPLOADER
  },
  {
    key: BASEROLE.PRO,
    value: baseRoleContant.PRO
  }
];

export const baseRoleCheckBoxOptions = [
  {
    key: BASEROLE_CHECKBOX.DATADL,
    value: baseRoleCheckboxContant.DATADL,
    text: baseRoleTextCheckboxContant.DATADL
  },
  {
    key: BASEROLE_CHECKBOX.XMLEDIT,
    value: baseRoleCheckboxContant.XMLEDIT,
    text: baseRoleTextCheckboxContant.XMLEDIT
  },
]

export enum USERROLE {
  USER = 1,
  ADMIN = 2
}

export const userRoleContant = {
  USER: 'User',
  ADMIN: 'Admin',
};

export const userRoleOptions = [
  { key: USERROLE.USER, value: userRoleContant.USER },
  { key: USERROLE.ADMIN, value: userRoleContant.ADMIN },
]
export const ROLE_NEW_TYPE = {
  ROLE_ADMIN: 'ROLE_ADMIN',
  ROLE_USER_XML_EDIT: 'ROLE_USER_XML_EDIT',
  ROLE_USER_DATA_DL: 'ROLE_USER_DATA_DL',
  ROLE_USER_PRO: 'ROLE_USER_PRO',
  ROLE_USER_UPLOADER: 'ROLE_USER_UPLOADER',
  ROLE_USER_STANDARD: 'ROLE_USER_STANDARD',
  ROLE_USER_MINIMUM: 'ROLE_USER_MINIMUM',
}

export const REPORTING_FORMAT = {
  TAG: {
    YES: 'YES',
    NO: 'NO'
  },
  TIME_FORMAT: {
    SEC: 'SEC',
    FULL_TIME: 'FULL_TIME'
  }
};
