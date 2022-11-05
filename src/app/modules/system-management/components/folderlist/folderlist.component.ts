import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { configsProjectList, folderConfig } from '@app/configs/app-settings.config';
import { PopupAssignUsergroupComponent } from '../popup-assign-usergroup/popup-assign-usergroup.component';
import { PopupAddFolderComponent } from '../popup-add-folder/popup-add-folder.component';
import {
  ErrorCodeConstant,
  messageConstant,
  ROLE_NEW_TYPE,
  SYSTEM_MANAGEMENT_RESPONSE
} from '@app/configs/app-constants';
import { HttpErrorResponse } from '@angular/common/http';
import { TableComponent } from '@app/shared/components/table/table.component';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';

@Component({
  selector: 'app-folderlist',
  templateUrl: './folderlist.component.html',
  styleUrls: ['./folderlist.component.scss']
})
export class FolderlistComponent implements OnInit, OnChanges {
  @Input() projectId: any;
  @ViewChild('folderTable', { static: false }) folderTable: TableComponent;
  constructor(
    public dialog: MatDialog,
    private dialogService: DialogService,
    private spinner: SpinnerService,
    private systemService: SystemManagementService,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {
    this.isEdit = false;
  }
  editList = [];
  deleteList = [];
  cols: any[];
  tableConfig: any;
  keySearch: string;
  data: any[];
  folderListBackup: any[];
  isEdit: boolean;
  ngChange: SimpleChanges;
  isRoleAdmin= false;
  isRoleUserPro = false;
  folderListFromApi: any[];
  ngOnInit() {
    this.keySearch = '';
    this.cols = [...configsProjectList.cols];
    this.tableConfig = { ...configsProjectList.tableConfig };
    this.tableConfig.selection = false;
    this.data = [];
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0 && this.projectId) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
          );
          if (!this.isRoleAdmin) {
            const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], this.projectId);
            const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(this.projectId, data.user_policies);
            const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy, (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
            this.isRoleUserPro = CheckUserPermission.userPermission(
              ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, this.projectId, dataCustomUserPolicies
            );
          }
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.projectId && changes.projectId.currentValue !== changes.projectId.previousValue) {
      // init again
      this.ngOnInit();
      this.ngChange = changes;
      this.isEdit = false;

      // API get folder list
      this.spinner.show();
      this.systemService.getFolderList(this.projectId).subscribe(
        response => {
          this.folderListFromApi = JSON.parse(JSON.stringify(response.folderList));
          this.folderListBackup = [...response.folderList];
          this.editList = [];
          this.deleteList = [];
          this.processResponse(response);
        },
        err => {
          this.processResponse({
            folderList: []
          });
          this.spinner.hide();
        }
      );
      this.headerService.projectIdActice.next(this.projectId);
    }

  }
  processResponse(response: any) {
    this.cols.length = 0;
    this.data.length = 0;
    const optionsDropdown = folderConfig.userPrivileges;
    const rowConfigs = folderConfig.rowConfigs;
    if (response.folderList.length > 0) {
      // make cols array
      this.cols = response.folderList[0].userGroups.map(userGroup => {
        const userGroupLabel = userGroup.name.trim().replace(/ +/g, '');
        rowConfigs[userGroupLabel] = {
          editable: true,
          type: 'dropdown',
          options: optionsDropdown
        };
        return {
          id: userGroup.id,
          field: userGroupLabel,
          header: userGroup.name
        };
      });

      this.tableConfig.rowConfigs = rowConfigs;

      // make data (table) array
      for (const [index, folder] of response.folderList.entries()) {
        const aRow = { id: folder.id, noneHeader: folder.name };
        for (const userGroup of folder.userGroups) {
          const userGroupLabel = userGroup.name.trim().replace(/ +/g, '');
          aRow[userGroupLabel] = userGroup.type || 'None';
        }
        this.data.push(aRow);
      }
      this.cols = [{ field: 'noneHeader', header: 'User Group' }, ...this.cols];
    }
    this.spinner.hide();
  }

  handleSelectItem(event) {
    // handle select item
  }

  handleSaveEdit(event) {
    const index = this.editList.findIndex(x => x.id === event.rowData.id);
    if (index !== -1) {
      // check exist and replace
      this.editList[index] = event.rowData;
    } else {
      this.editList.push(event.rowData);
    }
    const editListCustom = this.editList.map(edit => {
      const userGroup = [];
      for (let index = 1; index < this.cols.length; index++) {
        const field = this.cols[index].field;
        userGroup.push({
          id: this.cols[index].id,
          name: this.cols[index].header,
          type: edit[field]
        });
      }
      return {
        edit_id: edit.id,
        name: edit.noneHeader,
        userGroups: userGroup
      };
    });

    this.folderListBackup = this.folderListBackup.filter(item => {
      if (item.id === event.rowData.id) {
        item.name = event.rowData.noneHeader;
        editListCustom.filter(editData => {
          if (editData.edit_id === item.id) {
            item.userGroups = editData.userGroups;
          }
        })
      }
      return item;
    })
    this.isEdit = true;
  }

  handleDeleteItem(event) {
    const index = this.deleteList.findIndex(x => x.id === event.rowData.id);
    if (index !== -1) {
      this.deleteList[index] = event.rowData;
    } else {
      this.deleteList.push(event.rowData);
    }
    this.processResponse({
      folderList: this.folderListBackup.filter(x => this.deleteList.filter(f => f.id === x.id).length === 0)
    });
    this.isEdit = true;
  }

  openPopupAssignUserGroup() {
    let dataDialog = [];
    if (
      this.folderListBackup &&
      this.folderListBackup.length &&
      this.folderListBackup[0].userGroups &&
      this.folderListBackup[0].userGroups.length && // delete condition below when userGroup = [] if empty
      this.folderListBackup[0].userGroups[0].id
    ) {
      dataDialog = this.folderListBackup[0].userGroups;
    }
    const dialogRef = this.dialog.open(PopupAssignUsergroupComponent, {
      width: '100%',
      height: '440px',
      minWidth: '560px',
      maxWidth: '560px',
      disableClose: true,
      data: { projectId: this.projectId, dataDialog },
      panelClass: 'assign-user-dialog-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reloadFolder();
      }
    });
  }

  saveChange() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save all video change?'
    };
    this.dialogService.confirm(param).subscribe(isOK => {
      if (isOK) {
        this.applyChange();
      }
    }, this.catchError.bind(this));
  }
  applyChange() {
    const edits = this.editList.map(x => {
      const userGroup = [];
      for (let index = 1; index < this.cols.length; index++) {
        const field = this.cols[index].field;
        userGroup.push({
          type: x[field],
          id: this.cols[index].id
        });
      }
      return {
        folder_id: x.id,
        name: x.noneHeader,
        userGroups: userGroup
      };
    });
    if (edits.length === 0) {
      this.deleteData();
      return;
    }
    this.spinner.show();
    this.systemService.updateTypeFolder(edits).subscribe(
      data => {
        this.deleteData();
      },
      err => {
        this.spinner.hide();
        if (err instanceof HttpErrorResponse) {
          switch (err.error.message) {
            case ErrorCodeConstant.NAME_ALREADY:
              this.toastr.error(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_DUPLICATE);
              break;
            case ErrorCodeConstant.NAME_EMPTY:
              this.toastr.error(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_EMPTY);
              break;
            case ErrorCodeConstant.NAME_SPECIAL:
              this.toastr.error(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_SPECIAL_CHARACTER);
              break;
          }
          this.catchError(err);
          this.reloadFolder();
        } else {
          this.toastr.error('Update data failed');
          this.reloadFolder();
        }
      }
    );
  }
  deleteData() {
    const deletes = this.deleteList.map(x => {
      return {
        folder_id: x.id
      };
    });
    if (deletes.length === 0) {
      this.reloadFolder();
      this.toastr.success(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_SUCCESS);
      return;
    }
    this.spinner.show();
    this.systemService.deleteFolder(deletes).subscribe(
      result => {
        this.reloadFolder();
        this.toastr.success(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_SUCCESS);
      },
      err => {
        this.reloadFolder();
        this.processResponse({ folderList: JSON.parse(JSON.stringify(this.folderListBackup)) });
        this.catchError(err);
      }
    );
  }
  catchError(err) {
    this.spinner.hide();
    if (err instanceof HttpErrorResponse) {
      const messageCode = err.error.message.substr(0, err.error.message.indexOf(':'));
      switch (messageCode) {
        case SYSTEM_MANAGEMENT_RESPONSE.CODE.SYSTEM_MANAGEMENT_01:
          this.toastr.error(SYSTEM_MANAGEMENT_RESPONSE.MESSAGE.SYSTEM_MANAGEMENT_01);
          break;
        case SYSTEM_MANAGEMENT_RESPONSE.CODE.SYSTEM_MANAGEMENT_02:
          this.toastr.error(SYSTEM_MANAGEMENT_RESPONSE.MESSAGE.SYSTEM_MANAGEMENT_02);
          break;
      }
    }
  }
  cancelChange() {
    if (!!this.folderTable) {
      this.folderTable.cancelEditAll();
    }
    this.editList.length = 0;
    this.deleteList.length = 0;
    this.processResponse({ folderList: JSON.parse(JSON.stringify(this.folderListFromApi)) });
    this.isEdit = false;
  }
  handleAddFolder() {
    const dialogRef = this.dialog.open(PopupAddFolderComponent, {
      width: '25%',
      minWidth: '500px',
      data: {
        projectId: this.projectId
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        // Checking editing status
        if (this.isEdit) {
          this.applyChange();
        }
        this.reloadFolder();
      }
    });
  }
  reloadFolder() {
    this.ngOnChanges(this.ngChange);
  }
}
