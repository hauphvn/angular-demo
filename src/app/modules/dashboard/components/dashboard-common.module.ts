import { TextMaskModule } from 'angular2-text-mask';
import { ReactiveFormsModule } from '@angular/forms';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgCoreModule } from 'videogular2/compiled/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModules } from '@app/shared/modules/shared.module';
import { GanttChartComponent } from '../components/gantt-chart/gantt-chart.component';
import { DashboardVideoComponent } from '../components/dashboard-video/dashboard-video.component';
import { LeftSideComponent } from '../components/left-side/left-side.component';
import { ControllBarComponent } from '../components/controll-bar/controll-bar.component';
import { DashboardCommentComponent } from '../components/dashboard-comment/dashboard-comment.component';
import { DashboardCommentItemComponent } from '../components/dashboard-comment-item/dashboard-comment-item.component';
import { DashboardSliderComponent } from '../components/dashboard-slider/dashboard-slider.component';
import { PopupEditCommentComponent } from '../components/popup-edit-comment/popup-edit-comment.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { DashboardSliderScalingComponent } from './dashboard-slider-scaling/dashboard-slider-scaling.component';
import { GetTimeCommentPipe } from '../../../shared/pipes/get-time-comment.pipe';

@NgModule({
  declarations: [
    DashboardVideoComponent,
    LeftSideComponent,
    ControllBarComponent,
    DashboardCommentComponent,
    DashboardCommentItemComponent,
    DashboardSliderComponent,
    GanttChartComponent,
    LineChartComponent,
    DashboardSliderScalingComponent,
    GetTimeCommentPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    SharedModules,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    ReactiveFormsModule,
    TextMaskModule
  ],
  entryComponents: [],
  exports: [
    DashboardVideoComponent,
    LeftSideComponent,
    ControllBarComponent,
    DashboardCommentComponent,
    DashboardCommentItemComponent,
    DashboardSliderComponent,
    GanttChartComponent,
    LineChartComponent
  ]
})
export class DashboardCommonModule {}
