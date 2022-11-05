import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  Output,
  EventEmitter, ViewChild, ElementRef, Renderer, Renderer2
} from '@angular/core';
import { ReportService } from '@app/core/services/server-services/report.service';
import { MatCheckboxChange } from '@angular/material';
import { REPORTING_RESPONSE } from '@app/configs/app-constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-scene-tag-reporting',
  templateUrl: './scene-tag-reporting.component.html',
  styleUrls: ['./scene-tag-reporting.component.scss']
})
export class SceneTagReportingComponent implements OnInit, OnChanges {
  @Input() videoSets: any;
  @Input() projectId: number;
  @Output() tagSelect: EventEmitter<any> = new EventEmitter();
  @Output() sceneSelect: EventEmitter<any> = new EventEmitter();
  @Output() objSceneTagFolderRemoved: EventEmitter<any> = new EventEmitter<any>();
  @Output() sceneTagAfterChangeVideoSet: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('divScene', { static: false }) divScene: ElementRef;
  @ViewChild('divTag', { static: false }) divTag: ElementRef;
  scenes = [];
  tags = [];
  scenesSelected = [];
  tagsSelected = [];
  objSceneTag = {
    projectId: 0,
    scenes: this.scenesSelected,
    tags: this.tagsSelected
  }
  selectedSceneOptions = {};
  selectedTagsOptions = {};

  sceneCheckAll: boolean = false;
  tagCheckAll: boolean = false;

  constructor(
    private rd: Renderer2,
    private reportService: ReportService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.objSceneTag.projectId = this.projectId;
  }

  ngOnChanges() {
    this.getSceneTagByVideoSet();
    if (this.objSceneTag.tags && this.objSceneTag.tags.length === 0) {
      this.tagCheckAll = false;
    }
    if (this.objSceneTag.scenes && this.objSceneTag.scenes.length === 0) {
      this.sceneCheckAll = false;
    }
  }

  getSceneTagByVideoSet() {
    this.spinner.show();
    let videoIds = this.videoSets.map((video: any) => video.id);
    if (videoIds && videoIds.length > 0) {
      this.reportService.getSceneTagByVideoSet(videoIds).subscribe((res) => {
        this.scenes = res.scenes;
        this.tags = res.tags;
        this.objSceneTag.scenes = this.objSceneTag.scenes.filter(sceCheck => res.scenes.includes(sceCheck));
        this.objSceneTag.tags = this.objSceneTag.tags.filter(tagCheck => res.tags.includes(tagCheck));
        this.tagCheckAll = this.objSceneTag.tags != null && this.objSceneTag.tags.length > 0 && this.objSceneTag.tags.length === this.tags.length;
        this.sceneCheckAll = this.objSceneTag.scenes != null && this.objSceneTag.scenes.length > 0 && this.objSceneTag.scenes.length === this.scenes.length;
        this.selectedSceneOptions = this.selectedOptions(this.objSceneTag.scenes);
        this.selectedTagsOptions = this.selectedOptions(this.objSceneTag.tags);
        this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
        this.spinner.hide();
      }, (error) => {
        const messageCode = error.error.message.substr(0, error.error.message.indexOf(':'));
          switch (messageCode) {
            case REPORTING_RESPONSE.CODE.REPORTING_01:
              this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_01);
              break;
            case REPORTING_RESPONSE.CODE.REPORTING_02:
              this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_02);
              break;
            case REPORTING_RESPONSE.CODE.REPORTING_03:
              this.toastr.error(REPORTING_RESPONSE.MESSAGE.REPORTING_03);
              break;
          }
          this.spinner.hide();
      });
    } else {
      this.tags = [];
      this.scenes = [];
      this.objSceneTag.scenes = [];
      this.objSceneTag.tags = [];
      this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
      this.spinner.hide();
    }
  }

  tagChange(event: MatCheckboxChange) {
    if (event.checked) {
      this.objSceneTag.tags.push(event.source.value);
    } else {
      this.objSceneTag.tags.splice(this.objSceneTag.tags.indexOf(event.source.value), 1);
    }
    this.tagSelect.emit({
      add: event.checked,
      value: event.source.value,
      selectAll: false
    });
    this.tagCheckAll = this.objSceneTag.tags != null && this.objSceneTag.tags.length === this.tags.length;
    this.selectedTagsOptions = this.selectedOptions(this.objSceneTag.tags);
    this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
  }

  sceneChange(event: MatCheckboxChange) {
    if (event.checked) {
      this.objSceneTag.scenes.push(event.source.value);
    } else {
      this.objSceneTag.scenes.splice(this.objSceneTag.scenes.indexOf(event.source.value), 1);
    }
    this.sceneSelect.emit({
      add: event.checked,
      value: event.source.value,
      selectAll: false
    });
    this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
    this.sceneCheckAll = this.objSceneTag.scenes != null && this.objSceneTag.scenes.length === this.scenes.length;
    this.selectedSceneOptions = this.selectedOptions(this.objSceneTag.scenes);
  }

  private getSceneTagCurrent() {
    // Save scenes, tags was selected
    if (this.divScene) {
      this.scenesSelected = [];
      this.divScene.nativeElement.querySelectorAll('mat-checkbox[class~="sceneSelected"] input.mat-checkbox-input').forEach(item => {
        if (item.checked) {
          this.scenesSelected.push(item.value)
        }
      });
    }
    if (this.divTag) {
      this.tagsSelected = [];
      this.divTag.nativeElement.querySelectorAll('mat-checkbox[class~="tagSelected"] input.mat-checkbox-input').forEach(item => {
        if (item.checked) {
          this.tagsSelected.push(item.value)
        }
      });
    }
    this.objSceneTag.scenes = this.scenesSelected;
    this.objSceneTag.tags = this.tagsSelected;
    this.objSceneTagFolderRemoved.emit(this.objSceneTag);
  }

  selectedOptions (data: any) {
    return data.reduce(
      (previousValue, currentValue) => ({
        ...previousValue,
        [currentValue]: true,
      }),
      {},
    );
  }

  setSceneAll (completed: boolean) {
    this.sceneCheckAll = completed;
    if (this.objSceneTag.scenes == null) {
      return;
    }
    if (completed === true) {
      this.objSceneTag.scenes = [...this.scenes];
    } else {
      this.objSceneTag.scenes = [];
    }
    this.sceneSelect.emit({
      add: completed,
      value: [...this.scenes],
      selectAll: true
    });
    this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
    this.selectedSceneOptions = this.selectedOptions(this.objSceneTag.scenes);
  }

  setTagAll (completed: boolean) {
    this.tagCheckAll = completed;
    if (this.objSceneTag.tags == null) {
      return;
    }
    if (completed === true) {
      this.objSceneTag.tags = [...this.tags];
    } else {
      this.objSceneTag.tags = [];
    }
    this.tagSelect.emit({
      add: completed,
      value: [...this.tags],
      selectAll: true
    });
    this.sceneTagAfterChangeVideoSet.emit(this.objSceneTag);
    this.selectedTagsOptions = this.selectedOptions(this.objSceneTag.tags);
  }
}
