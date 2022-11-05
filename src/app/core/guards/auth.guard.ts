// An angular route guard that's used to prevent unauthenticated users from accessing restricted routes

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../authentication/authentication.service';
import { NAVIGATE, userManagementRoleContants, userPolicies } from '@app/configs/app-constants';
import { HeaderService } from '../services/component-services/header.service';
import { UserManagementService } from '../services/server-services/usermanagement.service';
import { CheckUserPermission } from '@app/shared/utils/common';
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private headerService: HeaderService,
    private userManService: UserManagementService,
  ) { }
  userManagementRoleContants = userManagementRoleContants;
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authenticationService.currentUserValue;
    const pathIFrame = 'iframe-dashboard';
    if (currentUser) {
      this.headerService.userManagementRole.subscribe(res => {
        if (res && Object.entries(res).length > 0) {
          const currentProjectId = JSON.parse(localStorage.getItem('currentProjectId'));
          const currentFoldertId = JSON.parse(localStorage.getItem('currentFoldertId'));
          const dataCustomUserPolicies: any = CheckUserPermission.getRoleBaseByFolderId(currentProjectId, currentFoldertId, res.user_policies);
          const maxPolicy = CheckUserPermission.getMaxPolicies(res.user_policies, currentProjectId);
          this.headerService.fullName.next(res.full_name);
          this.headerService.roleAccount.next(res.user_role[0] === this.userManagementRoleContants.USER_ROLE_ADMIN);
          if (route.data.isAdminRequire) {
            if (!res.user_role.includes(this.userManagementRoleContants.USER_ROLE_ADMIN)) {
              if (route.data.isUserProRequire) {
                if (maxPolicy[0] !== userPolicies.PRO) {
                  this.router.navigate(['/']);
                  return true;
                }
              } else if (route.data.isUserXMLEditRequire) {
                if (!dataCustomUserPolicies[0].user_policies.includes(userPolicies.XML_EDIT)) {
                  this.router.navigate(['/']);
                  return true;
                }
              } else {
                this.router.navigate(['/']);
                return true;
              }
            }
          } else if (route.data.isUserNoneRequire) {
            if (maxPolicy[0] === userPolicies.NONE) {
              this.router.navigate(['/']);
              return true;
            }
          }
          return false;
        }
      });
      return true;
    } else {
      if (route.routeConfig.path === pathIFrame && route.queryParams.videoID && route.queryParams.token) {
        return true;
      }
    }
    // not logged in so redirect to login page with the return url
    this.router.navigate([`/${NAVIGATE.LOGIN}`], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
