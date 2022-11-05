import { RouterModule, Routes } from '@angular/router';
import { DashboardEditXmlComponent } from './dashboard-edit-xml.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: DashboardEditXmlComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardEditXmlRoutingModule {}
