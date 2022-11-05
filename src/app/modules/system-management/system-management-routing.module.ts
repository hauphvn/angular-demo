import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemManagementComponent } from './system-management.component';
import { ProjectManagementComponent } from './components/project-management/project-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { SystemLogComponent } from './components/system-log/system-log.component';
import { AuthGuard } from '@app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: SystemManagementComponent,
    children: [
      {
        path: '',
        redirectTo: 'project-management',
        pathMatch: 'full',
        canActivate: [AuthGuard],
        data: { isAdminRequire: true, isUserProRequire: true }
      },
      {
        path: 'project-management',
        component: ProjectManagementComponent,
        canActivate: [AuthGuard],
        data: { isAdminRequire: true, isUserProRequire: true }
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [AuthGuard],
        data: { isAdminRequire: true}
      },
      {
        path: 'activity-log',
        component: SystemLogComponent,
        canActivate: [AuthGuard],
        data: { isAdminRequire: true }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SystemManagementRoutingModule {}
