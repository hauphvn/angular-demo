import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { Role } from '@app/configs/app-settings.config';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'video-management',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: './modules/login/login.module#LoginModule'
  },
  // {
  //   path: 'forgot',
  //   loadChildren: './modules/forgot-password/forgot-password.module#ForgotPasswordModule'
  // },
  {
    path: 'dashboard',
    loadChildren: './modules/dashboard/dashboard.module#DashboardModule',
    canActivate: [AuthGuard],
    data: {isUserNoneRequire: true}
  },
  {
    path: 'iframe-dashboard',
    loadChildren: './modules/dashboard/iframe/dashboard-iframe.module#IFrameDashboardModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/:videoId',
    loadChildren: './modules/dashboard-cutvideo/dashboard-cutvideo.module#DashboardCutVideoModule',
    canActivate: [AuthGuard],
    data: {isUserNoneRequire: true}
  },
  {
    path: 'dashboard/edit/XML',
    loadChildren: './modules/dashboard-edit-xml/dashboard-edit-xml.module#DashboardEditXmlModule',
    canActivate: [AuthGuard],
    data: {isAdminRequire: true, isUserNoneRequire: true, isUserXMLEditRequire: true}
  },
  {
    path: 'system-management',
    loadChildren: './modules/system-management/system-management.module#SystemManagementModule',
    canActivate: [AuthGuard],
    data: { isAdminRequire: true, isUserProRequire: true }
  },
  {
    path: 'video-management',
    loadChildren: './modules/video-management/video-management.module#VideoManagementModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'report',
    loadChildren: './modules/reporting/report.module#ReportModule',
    canActivate: [AuthGuard],
    data: {isUserNoneRequire: true}
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
