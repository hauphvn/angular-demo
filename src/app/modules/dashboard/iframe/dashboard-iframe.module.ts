import { DashboardCommonModule } from '../components/dashboard-common.module';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IFrameDashboardRoutingModule } from './dashboard-iframe-routing.module';
import { IFrameDashboardComponent } from './dashboard-iframe.component';

import { SharedModules } from '@app/shared/modules/shared.module';

import { VgCoreModule } from 'videogular2/compiled/core';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';
import { AngularSplitModule } from 'angular-split';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextMaskModule } from 'angular2-text-mask';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';

@NgModule({
  declarations: [
    IFrameDashboardComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IFrameDashboardRoutingModule,
    SharedModules,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    AngularSplitModule,
    FormsModule,
    ReactiveFormsModule,
    TextMaskModule,
    DashboardCommonModule
  ],
  entryComponents: [],
  providers: [GanttLineService]
})
export class IFrameDashboardModule {}
