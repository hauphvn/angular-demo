export enum Role {
  Admin = 'Admin',
  User = 'User'
}

export const TOAST_TIMEOUT = 5000;

export const ROWS_PER_PAGE_PROJECT = 10;

export const ROWS_PER_PAGE_FOLDER = 5;

export const configsUserList = {
  cols: [
    { field: 'fullName', header: 'Name' },
    { field: 'email', header: 'Email' },
    { field: 'groupName', header: 'User Group' },
    { field: 'roleValue', header: 'Role' },
    { field: 'description', header: 'Comment' }
  ],
  tableConfig: {
    key: 'id',
    rowConfigs: {
      id: {
        editable: false,
        type: ''
      },
      fullName: {
        editable: false,
        type: ''
      },
      email: {
        editable: false,
        type: ''
      },
      description: {
        editable: false,
        type: ''
      },
      groupName: {
        editable: false,
        type: ''
      },
      roleValue: {
        editable: false,
        type: ''
      }
    },
    functions: ['edit', 'delete'],
    hScroll: true,
    vScroll: false,
    selection: false
  }
};
export const configsUserGroupList = {
  cols: [
    { field: 'name', header: 'User Group' },
    { field: 'member', header: 'Member' },
    { field: 'description', header: 'Comment' }
  ],
  tableConfig: {
    key: 'id',
    rowConfigs: {
      name: {
        editable: false,
        type: ''
      },
      member: {
        editable: false,
        type: ''
      },
      description: {
        editable: false,
        type: ''
      }
    },
    functions: ['edit', 'delete'],
    hScroll: true,
    vScroll: false,
    selection: false
  }
};

export const configsProjectList = {
  cols: [
    { field: 'name', header: 'Project Name' },
    { field: 'creater', header: 'Creator' },
    { field: 'createDate', header: 'Additional Date' },
    { field: 'comment', header: 'Comment' }
  ],
  tableConfig: {
    key: 'id',
    rowConfigs: {
      id: {
        editable: false,
        type: ''
      },
      name: {
        editable: false,
        type: ''
      },
      comment: {
        editable: false,
        type: ''
      },
      creater: {
        editable: false,
        type: ''
      },
      createDate: {
        editable: false,
        type: ''
      }
    },
    functions: ['edit', 'delete'],
    hScroll: true,
    vScroll: false,
    editType: 'inline',
    selection: true
  }
};

export const folderConfig = {
  userPrivileges: [
    { label: 'NONE', value: 'NONE' },
    { label: 'VIEWER', value: 'VIEWER' },
    // { label: 'EDITOR', value: 'EDITOR' }
  ],
  rowConfigs: {
    id: {
      editable: false,
      type: ''
    },
    noneHeader: {
      editable: true,
      type: 'input',
      maxLength: 200
    }
  },
  enum: {
    NONE: 'NONE',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER'
  }
};
export const FileExtension = {
  VIDEO: ['.mp4', '.mov'],
  XML: ['.xml'],
  TIME_SERIES: ['.csv']
};
