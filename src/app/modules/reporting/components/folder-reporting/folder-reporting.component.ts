import { ReportService } from './../../../../core/services/server-services/report.service';
import { Component, OnInit, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { MatCheckboxChange } from '@angular/material';

@Component({
  selector: 'app-folder-reporting',
  templateUrl: './folder-reporting.component.html',
  styleUrls: ['./folder-reporting.component.scss']
})
export class FolderReportingComponent implements OnInit, OnChanges {
  @Input() folder: any;
  @Input() allVideoListMerge: any;
  @Output() listObjVideoSets: EventEmitter<any> = new EventEmitter();
  @Output() optionsSelect: EventEmitter<any> = new EventEmitter();
  @Output() addVideoSetListMerge: EventEmitter<any> = new EventEmitter();
  @Output() folderIdMerge: EventEmitter<any> = new EventEmitter();  
  tempSearching = '';
  tempVideos = [];
  videos = [];
  videoSelected = [];
  videoCheckAll: boolean = false;

  constructor(
    private spinner: SpinnerService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.spinner.show();
    this.reportService.getListVideoByFolder(this.folder.id).subscribe((res) => {
      res.forEach(item =>{
        item.checked = false;
        this.videos.push(item);
        this.tempVideos.push(item);
        this.addVideoSetListMerge.emit([...this.allVideoListMerge, ...this.videos]);
      });
      this.spinner.hide();
    }, () => {
      this.spinner.hide();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.allVideoListMerge && this.allVideoListMerge.length > 0 && changes.allVideoListMerge.currentValue !== changes.allVideoListMerge.previousValue) {
      const checkAll = this.allVideoListMerge != null && this.allVideoListMerge.every(t => t.checked);
      this.videoCheckAll = checkAll;
    }
  }

  change(event: MatCheckboxChange) {
    this.listObjVideoSets.emit({
      id: this.folder.id,
      videoSet: event.source.value,
      checked: event.source.checked,
      selectAll: {status: false}
    });
    this.optionsSelect.emit({item: event.source.value, selectAll: {status: false}});
    this.folderIdMerge.emit(this.folder.id);
    this.videos.forEach(item =>{
      if(+item.id === +event.source.id){
        item.checked = !item.checked;
      }
    });
    const checkAll = this.allVideoListMerge != null && this.allVideoListMerge.every(t => t.checked);
    this.videoCheckAll = checkAll;
  }

  setAll(completed: boolean) {
    this.videoCheckAll = completed;
    if (this.allVideoListMerge == null) {
      return;
    }
    this.allVideoListMerge.forEach(t => t.checked = completed);
    this.optionsSelect.emit({item: this.allVideoListMerge, selectAll: {status: true, completed}});
    this.folderIdMerge.emit(this.folder.id);
    this.listObjVideoSets.emit({
      id: this.folder.id,
      videoSet: this.allVideoListMerge,
      checked: completed,
      selectAll: {status: true, completed}
    });
  }
}
