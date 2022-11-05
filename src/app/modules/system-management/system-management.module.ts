import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CalendarModule} from 'primeng/calendar';

import { SystemManagementRoutingModule } from './system-management-routing.module';
import { SystemManagementComponent } from './system-management.component';
import { SharedModules } from '@app/shared/modules/shared.module';
import { ProjectManagementComponent } from './components/project-management/project-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { PopupAddUserComponent } from './components/popup-add-user/popup-add-user.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserGroupListComponent } from './components/user-group-list/user-group-list.component';
import { TableComponent } from '@app/shared/components/table/table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PopupUserGroupComponent } from './components/popup-user-group/popup-user-group.component';
import { ProjectlistComponent } from './components/projectlist/projectlist.component';
import { FolderlistComponent } from './components/folderlist/folderlist.component';
import { ProjectmanPopupAddprojectComponent } from './components/projectman-popup-addproject/projectman-popup-addproject.component';
import { PopupAssignUsergroupComponent } from './components/popup-assign-usergroup/popup-assign-usergroup.component';
import { PopupConfirmAssignUsergroupComponent } from './components/popup-confirm-assign-usergroup/popup-confirm-assign-usergroup.component';
import { PopupEditUserlistComponent } from './components/popup-edit-userlist/popup-edit-userlist.component';
import { PopupAddFolderComponent } from './components/popup-add-folder/popup-add-folder.component';
import { SystemLogComponent } from './components/system-log/system-log.component';

@NgModule({
  declarations: [
    SystemManagementComponent,
    ProjectManagementComponent,
    UserManagementComponent,
    PopupAddUserComponent,
    UserListComponent,
    UserGroupListComponent,
    TableComponent,
    PopupUserGroupComponent,
    ProjectlistComponent,
    FolderlistComponent,
    ProjectmanPopupAddprojectComponent,
    PopupAssignUsergroupComponent,
    PopupConfirmAssignUsergroupComponent,
    PopupEditUserlistComponent,
    PopupAddFolderComponent,
    SystemLogComponent
  ],
  imports: [CommonModule, SystemManagementRoutingModule, SharedModules, FormsModule, ReactiveFormsModule, CalendarModule],
  entryComponents: [
    PopupAddUserComponent,
    PopupUserGroupComponent,
    ProjectmanPopupAddprojectComponent,
    PopupAssignUsergroupComponent,
    PopupConfirmAssignUsergroupComponent,
    PopupEditUserlistComponent,
    PopupAddFolderComponent
  ]
})
export class SystemManagementModule {}
