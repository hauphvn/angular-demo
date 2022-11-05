import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardCutvideoComponent } from './dashboard-cutvideo.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardCutvideoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardCutVideoRoutingModule {}
