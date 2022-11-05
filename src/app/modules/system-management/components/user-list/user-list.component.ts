import { Component, OnInit, Input, Inject, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { UserModel } from '@app/shared/models/systemManagementModel';
import { MatDialog } from '@angular/material';
import { PopupAddUserComponent } from '../popup-add-user/popup-add-user.component';
import { configsUserList } from '@app/configs/app-settings.config';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { messageConstant, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { PopupEditUserlistComponent } from '../popup-edit-userlist/popup-edit-userlist.component';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @Input() userList: UserModel[] = [];
  @ViewChild('inputSearch', { static: true }) inputSearch: ElementRef;
  @Output() reloadUserList = new EventEmitter<any>();
  @Output() reloadUserGroupList = new EventEmitter<any>();
  userListBackup: UserModel[] = [];
  tableConfig: any;
  cols: any;
  userDelete: UserModel[] = [];
  deleteMode = false;
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
    this.cols = configsUserList.cols;
    this.tableConfig = configsUserList.tableConfig;
    this.userListBackup = this.userList;
    this.headerService.userRole.subscribe(data => {
      if (data && data.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data
        );
      }
    })
    let projectId = +localStorage.getItem('currentProjectId');
    this.headerService.projectIdActice.next(projectId);
  }

  handleSelectItem(event) {}

  handleDownLoadClick(event) {}

  handlEditClick(event) {
    if (!event.rowData) {
      return;
    }
    const dialogRef = this.dialog.open(PopupEditUserlistComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: event.rowData,
      disableClose: true,
      panelClass: 'user-list-dialog-class'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reloadUserGroupList.emit();
        this.reloadUserList.emit();
      }
    });
  }
  openPopupAddUserList() {
    const dialogRef = this.dialog.open(PopupAddUserComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {},
      disableClose: true,
      panelClass: 'user-list-dialog-class'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.reloadUserList.emit();
        this.reloadUserGroupList.emit();
      }
    });
  }

  handleDeleteItem(event) {
    const { rowData } = event;
    if (!rowData) {
      return;
    }
    const data = {
      users_id: rowData.id
    };
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: `You have been changed your table.\nWould you like to save it?`
    };
    this.dialogService.confirm(param).subscribe(res => {
      if (!res) {
        return;
      }
      this.spinner.show();
      this.systemService.deleteUser(data).subscribe(result => {
        this.spinner.hide();
        this.reloadUserGroupList.emit();
        this.reloadUserList.emit();
        this.toastr.success('Deleted successfully');
      }, this.catchError.bind(this));
    }, this.catchError.bind(this));
  }

  catchError(err) {
    this.spinner.hide();
    this.toastr.error(err.message || err);
  }
}
