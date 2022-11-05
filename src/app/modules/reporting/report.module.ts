import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportRoutingModule } from './report-routing.module';
import { SharedModules } from '@app/shared/modules/shared.module';
import { ReportComponent } from './report.component';
import { ProjectReportingComponent } from './components/project-reporting/project-reporting.component';
import { FolderReportingComponent } from './components/folder-reporting/folder-reporting.component';
import { SceneTagReportingComponent } from './components/scene-tag-reporting/scene-tag-reporting.component';
import { ReportingPreviewComponent } from './components/reporting-preview/reporting-preview.component';
import { DashboardCommonModule } from '../dashboard/components/dashboard-common.module';
import { AngularSplitModule } from 'angular-split';
import { PopupValidateExportComponent } from './components/popup-validate-export/popup-validate-export.component';

@NgModule({
  declarations: [
    ReportComponent,
    ProjectReportingComponent,
    FolderReportingComponent,
    SceneTagReportingComponent,
    ReportingPreviewComponent,
    PopupValidateExportComponent
  ],
  imports: [CommonModule, ReportRoutingModule, SharedModules, FormsModule, ReactiveFormsModule, DashboardCommonModule, AngularSplitModule],
  entryComponents: [ReportComponent, ReportingPreviewComponent, PopupValidateExportComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [GanttLineService]
})
export class ReportModule {}
