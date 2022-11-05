import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoManagementComponent } from './video-management.component';

const routes: Routes = [
  {
    path: '',
    component: VideoManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VideoManagementRoutingModule {}
