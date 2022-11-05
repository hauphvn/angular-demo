import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { configsUserGroupList } from '@app/configs/app-settings.config';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { PopupUserGroupComponent } from '../popup-user-group/popup-user-group.component';
import { UserGroupModel } from '@app/shared/models/systemManagementModel';
import { messageConstant, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';

@Component({
  selector: 'app-user-group-list',
  templateUrl: './user-group-list.component.html',
  styleUrls: ['./user-group-list.component.scss']
})
export class UserGroupListComponent implements OnInit {
  @Input() userGroupList: UserGroupModel[] = [];
  @ViewChild('inputSearch', { static: true }) inputSearch: ElementRef;
  @Output() reloadUserList = new EventEmitter<any>();
  @Output() reloadUserGroupList = new EventEmitter<any>();
  tableConfig: any;
  cols: any;
  data: any;
  keySearch: string;
  isRoleAdmin = false;

  constructor(
    public dialog: MatDialog,
    private dialogService: DialogService,
    private spinner: SpinnerService,
    private systemService: SystemManagementService,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.tableConfig = configsUserGroupList.tableConfig;
    this.cols = configsUserGroupList.cols;
    this.headerService.userRole.subscribe(data => {
      if (data && data.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data
        );
      }
    })
  }

  openPopupUserGroup() {
    const dialogRef = this.dialog.open(PopupUserGroupComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: null,
      disableClose: true,
      panelClass: 'user-group-list-dialog-class'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.emitUserListAndUserGroupList();
      }
    }, this.catchError.bind(this));
  }

  handleSelectItem(e) {}

  handleSaveEdit(e) {}

  handleDeleteItem(e) {
    const { rowData } = e;
    if (!rowData) {
      return;
    }
    const data = {
      user_group_id: rowData.id
    };
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: `You have been changed your table. \n Would you like to save it?`
    };
    this.dialogService.confirm(param).subscribe(res => {
      if (!res) {
        return;
      }
      this.spinner.show();
      this.systemService.deleteUserList(data).subscribe(result => {
        this.reloadUserList.emit();
        this.reloadUserGroupList.emit();
        this.spinner.hide();
        this.toastr.success(messageConstant.USER_MANAGEMENT.USERGROUP_DELETE_SUCCESS);
      }, this.catchError.bind(this));
    }, this.catchError.bind(this));
  }

  catchError(err) {
    this.spinner.hide();
    this.toastr.error(messageConstant.USER_MANAGEMENT.USERGROUP_NOT_EXIST);
  }

  handlEditClick(e) {
    // check null
    if (!e.rowData) {
      return;
    }
    const dialogRef = this.dialog.open(PopupUserGroupComponent, {
      data: e.rowData,
      disableClose: true,
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      panelClass: 'user-group-list-dialog-class'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.emitUserListAndUserGroupList();
      }
    }, this.catchError.bind(this));
  }

  emitUserListAndUserGroupList() {
    this.reloadUserList.emit();
    this.reloadUserGroupList.emit();
  }
}
