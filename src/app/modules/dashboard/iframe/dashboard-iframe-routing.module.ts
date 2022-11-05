import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IFrameDashboardComponent } from './dashboard-iframe.component';

const routes: Routes = [
  {
    path: '',
    component: IFrameDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IFrameDashboardRoutingModule {}
