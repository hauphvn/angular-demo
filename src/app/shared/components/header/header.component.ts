import { Component, OnInit, ChangeDetectorRef, AfterViewChecked, ViewChild } from '@angular/core';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { Router } from '@angular/router';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { NAVIGATE, ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { MatDialog } from '@angular/material';
import { PopupChangePasswordComponent } from '../popup-change-password/popup-change-password.component';
import { UserManagementService } from '@app/core/services/server-services/usermanagement.service';
import { RouterService } from '@app/core/services/component-services/router.service';
import { environment } from '@environments/environment';
import { PopupDashboardSettingComponent } from '@app/modules/dashboard/components/popup-dashboard-setting/popup-dashboard-setting.component';
import { userPrivileges, userManagementRoleContants } from '@app/configs/app-constants';
import { CheckUserPermission } from '@app/shared/utils/common';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, AfterViewChecked {
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private authService: AuthenticationService,
    private headerService: HeaderService,
    private detectRef: ChangeDetectorRef,
    private routerService: RouterService,
    private userManService: UserManagementService,
  ) {}
  @ViewChild(PopupDashboardSettingComponent, { static: true }) dashboardSetting: PopupDashboardSettingComponent;
  currentUser;
  isDashboard: boolean;
  videoDetailId;
  isAdmin: boolean;
  TITLE = environment.webTitle;
  userPrivileges = userPrivileges;
  userManagementRoleContants = userManagementRoleContants;
  projectIdActice;
  response;
  isRoleAdmin = false;
  isRoleUserPro = false;
  userName;
  isRoleUserUploader = false;
  isRoleUserXMLEdit = false;
  isDashboardEditXml: boolean;

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      this.currentUser = u;
    });

    this.headerService.videoDetailId.subscribe(vId => {
      this.videoDetailId = vId;
    });

    this.userManService.getUserRole().subscribe(res => {
      this.headerService.userManagementRole.next(res);
      this.userName = res.full_name;
      this.isAdmin = res.user_role[0] === this.userManagementRoleContants.USER_ROLE_ADMIN;
      this.headerService.fullName.next(res.full_name);
      this.headerService.roleAccount.next(this.isAdmin);
      this.headerService.userRole.next(res.user_role);
      this.headerService.userPolicies.next(res.user_policies);
      this.response = res;
    });
    this.headerService.projectIdActice.subscribe(pId => {
      this.projectIdActice = pId;
    })
  }

  getRoleUser() {
    this.headerService.userManagementRole.subscribe(data => {
      if (data && data.user_role && data.user_role.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
          );
          if (!this.isRoleAdmin) {
          const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], this.projectIdActice);
          const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(this.projectIdActice, data.user_policies);
          const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy, (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
          this.isRoleUserPro = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, this.projectIdActice, dataCustomUserPolicies
          );
        }
      }
    })
  }

  ngAfterViewChecked() {
    this.isDashboard =
      location.href.includes(`/${NAVIGATE.DASHBOARD}`) && !location.href.includes(`/${NAVIGATE.DASHBOARD}/`);
    this.getRoleUser();
    this.detectRef.detectChanges();
  }

  handleSettingClick(event) {
    // Handle setting button click
    this.router.navigate([`/${NAVIGATE.SYSTEM_MANAGEMENT}`]);
  }

  handleReportClick() {
    this.router.navigate([`/${NAVIGATE.REPORTING}`]);
  }

  goToHome(isBack: boolean) {
    this.routerService.setIsBackFromDashboard(isBack);
    this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
  }

  logout() {
    this.authService.logout();
  }

  goToDashboard() {
    this.router.navigate([`/${NAVIGATE.DASHBOARD}`], { queryParams: { videoID: this.videoDetailId } });
  }

  handleChangePassClick() {
    this.dialog.open(PopupChangePasswordComponent, {
      width: '35%',
      minWidth: '408px',
      maxWidth: '408px',
      data: {},
      disableClose: true,
      panelClass: 'change-password-dialog-class'
    });
  }
}

