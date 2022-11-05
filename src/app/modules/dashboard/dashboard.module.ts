import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { DashboardCommonModule } from './components/dashboard-common.module';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';

import { SharedModules } from '@app/shared/modules/shared.module';

import { VgCoreModule } from 'videogular2/compiled/core';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';
import { AngularSplitModule } from 'angular-split';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PopupEditCommentComponent } from './components/popup-edit-comment/popup-edit-comment.component';
import { TextMaskModule } from 'angular2-text-mask';
import { PopupDashboardSettingComponent } from '@app/modules/dashboard/components/popup-dashboard-setting/popup-dashboard-setting.component';
import { ButtonModule } from 'primeng/button';
import { PopupEditReplyComponent } from './components/popup-edit-reply/popup-edit-reply.component';

@NgModule({
  declarations: [DashboardComponent, PopupEditCommentComponent, PopupDashboardSettingComponent, PopupEditReplyComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModules,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    AngularSplitModule,
    FormsModule,
    ReactiveFormsModule,
    TextMaskModule,
    ButtonModule,
    DashboardCommonModule
  ],
  entryComponents: [PopupEditCommentComponent, PopupEditReplyComponent],
  exports: [
    PopupDashboardSettingComponent
  ],
  providers: [GanttLineService]
})
export class DashboardModule {}
