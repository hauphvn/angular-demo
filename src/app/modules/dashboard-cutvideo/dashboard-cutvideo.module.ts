import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardCutvideoComponent } from './dashboard-cutvideo.component';
import { DashboardCutVideoRoutingModule } from './dashboard-cutvideo-routing.module';

import { SharedModules } from '@app/shared/modules/shared.module';

import { VgCoreModule } from 'videogular2/compiled/core';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CutvideoVideoboxComponent } from './components/cutvideo-videobox/cutvideo-videobox.component';
import { CutvideoControllBarComponent } from './components/cutvideo-controll-bar/cutvideo-controll-bar.component';
import { CutganttchartChartboxComponent } from './components/cutganttchart-chartbox/cutganttchart-chartbox.component';
import { DashboardCommonModule } from '../dashboard/components/dashboard-common.module';
import { CutlinechartChartboxComponent } from './components/cutlinechart-chartbox/cutlinechart-chartbox.component';
import { AngularSplitModule } from 'angular-split';
@NgModule({
  // tslint:disable-next-line:max-line-length
  declarations: [DashboardCutvideoComponent, CutvideoVideoboxComponent, CutvideoControllBarComponent, CutganttchartChartboxComponent, CutlinechartChartboxComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    DashboardCutVideoRoutingModule,
    SharedModules,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardCommonModule,
    AngularSplitModule
  ],
  providers: [GanttLineService]
})
export class DashboardCutVideoModule {}
