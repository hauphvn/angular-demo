import { Component, OnInit } from '@angular/core';
import { UserModel, UserGroupModel } from '@app/shared/models/systemManagementModel';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { HeaderService } from '@app/core/services/component-services/header.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  userList: UserModel[] = [];
  userGroupList: UserGroupModel[] = [];
  constructor(
    private systemService: SystemManagementService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.getUserGroupList();
    this.getUserList();
  }

  catchError(err: any) {
    this.toastr.error(err.message || err);
    this.spinner.hide();
  }
  getUserList() {
    this.spinner.show();
    this.systemService.getUserList().subscribe(listUser => {
      this.userList = listUser;
      this.spinner.hide();
    }, this.catchError.bind(this));
  }

  getUserGroupList() {
    this.spinner.show();
    this.systemService.getUserGroupList().subscribe(data => {
      this.userGroupList = data.map(group => {
        group.member = group.users.map(user => user.fullName).join(',');
        return group;
      });
      this.spinner.hide();
    }, this.catchError.bind(this));
  }
}
