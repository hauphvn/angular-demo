import { Component, OnInit } from '@angular/core';
import { ROLE_NEW_TYPE } from '@app/configs/app-constants';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';
@Component({
  selector: 'app-system-management',
  templateUrl: './system-management.component.html',
  styleUrls: ['./system-management.component.scss']
})
export class SystemManagementComponent implements OnInit {
  navLinks: any[];
  activeLinkIndex = -1;
  isRoleUserPro = false;
  isRoleAdmin = false;
  constructor(
    private headerService: HeaderService,
  ) {
    this.navLinks = [
      {
        label: 'Project Management',
        link: './project-management',
        index: 0
      },
      {
        label: 'User Management',
        link: './user-management',
        index: 1
      },
      {
        label: 'System Log',
        link: './activity-log',
        index: 2
      }
    ];
  }

  ngOnInit() {
    this.headerService.projectIdActice.subscribe(id => {
      this.headerService.userManagementRole.subscribe(data => {
        if (data && data.user_role && data.user_role.length > 0 && id) {
          this.isRoleAdmin = CheckUserPermission.userPermission(
            ROLE_NEW_TYPE.ROLE_ADMIN, data.user_role
            );
            if (!this.isRoleAdmin) {
              const headerPolicy = CheckUserPermission.getMaxPolicies(data && data.user_policies || [], id);
              const customUserPolicies: any = CheckUserPermission.getRoleBaseByProjectId(id, data.user_policies);
              const dataCustomUserPolicies = CheckUserPermission.customHeaderPolicy(headerPolicy, (customUserPolicies && customUserPolicies.length > 0 && [customUserPolicies[0]] || []));
              this.isRoleUserPro = CheckUserPermission.userPermission(
                ROLE_NEW_TYPE.ROLE_USER_PRO, data.user_role, id, dataCustomUserPolicies
              );
          }
        }
      })
    });
  }
}
