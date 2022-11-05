import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { DashboardEditXmlComponent } from '@app/modules/dashboard-edit-xml/dashboard-edit-xml.component';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';
import { CommonModule } from '@angular/common';
import { SharedModules } from '@app/shared/modules/shared.module';
import { VgCoreModule } from 'videogular2/compiled/core';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardCommonModule } from '../dashboard/components/dashboard-common.module';
import { DashboardEditXmlRoutingModule } from './dashboard-edit-xml-routing.module';
import { AngularSplitModule } from 'angular-split';
import { DashboardModule } from '@app/modules/dashboard/dashboard.module';
import { EditDecorateSceneComponent } from './components/edit-decorate-scene/edit-decorate-scene.component';
import { PopupSaveAsXmlComponent } from './components/popup-save-as-xml/popup-save-as-xml.component';
import { InputMaskModule } from 'primeng/inputmask';
import { TextMaskModule } from 'angular2-text-mask';
import { ColorGithubModule } from 'ngx-color/github';
@NgModule({
  declarations: [
    DashboardEditXmlComponent,
    EditDecorateSceneComponent,
    PopupSaveAsXmlComponent
  ],
  entryComponents: [PopupSaveAsXmlComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    SharedModules,
    DashboardEditXmlRoutingModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardCommonModule,
    AngularSplitModule,
    DashboardModule,
    InputMaskModule,
    TextMaskModule, ColorGithubModule
  ],
  providers: [GanttLineService]
})
export class DashboardEditXmlModule { }
