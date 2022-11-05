import { DragDropFileDirective } from './../../shared/directives/drag-drop-file.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VideoManagementRoutingModule } from './video-management-routing.module';
import { SharedModules } from '@app/shared/modules/shared.module';
import { VideoManagementComponent } from './video-management.component';
import { ProjectBoxComponent } from './components/project-box/project-box.component';
import { FolderTableComponent } from './components/folder-table/folder-table.component';
import { VideoComponent } from './components/video/video.component';
import { FolderListComponent } from './components/folder-list/folder-list.component';
import { PopupDocumentComponent } from './components/popup-document/popup-document.component';
import { PopupVideoDetailComponent } from './components/popup-video-detail/popup-video-detail.component';
import { PopupCopyVideoComponent } from './components/popup-copy-video/popup-copy-video.component';
import { UpdateConfirmDialogComponent } from './components/update-confirm-dialog/update-confirm-dialog.component';
import { PopupExportComponent } from './components/popup-export/popup-export.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

@NgModule({
  declarations: [
    VideoManagementComponent,
    ProjectBoxComponent,
    FolderTableComponent,
    VideoComponent,
    FolderListComponent,
    PopupDocumentComponent,
    PopupVideoDetailComponent,
    DragDropFileDirective,
    PopupCopyVideoComponent,
    UpdateConfirmDialogComponent,
    PopupExportComponent,
  ],
  imports: [CommonModule, VideoManagementRoutingModule, SharedModules, FormsModule, ReactiveFormsModule, NgMultiSelectDropDownModule.forRoot()],
  entryComponents: [
    PopupVideoDetailComponent,
    VideoManagementComponent,
    PopupDocumentComponent,
    PopupCopyVideoComponent,
    UpdateConfirmDialogComponent,
	PopupExportComponent,
  ]
})
export class VideoManagementModule {}
