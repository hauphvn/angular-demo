import { ReportService } from './../../../../core/services/server-services/report.service';
import { MatChipInputEvent, MatAutocompleteSelectedEvent } from '@angular/material';
import { startWith, map } from 'rxjs/operators';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';

@Component({
  selector: 'app-project-reporting',
  templateUrl: './project-reporting.component.html',
  styleUrls: ['./project-reporting.component.scss']
})
export class ProjectReportingComponent implements OnInit, OnDestroy {
  @Input() project: any;
  @Output() listObjProjects: EventEmitter<any> = new EventEmitter<any>();
  @Output() tagSelect: EventEmitter<any> = new EventEmitter();
  @Output() sceneSelect: EventEmitter<any> = new EventEmitter();
  @Output() videoSelect: EventEmitter<any> = new EventEmitter();
  @Output() sceneTagChangeVideoSet: EventEmitter<any> = new EventEmitter();

  allFolder = [];
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  allVideoListMerge = [];

  separatorKeysCodes = [ENTER, COMMA];

  folderCtrl = new FormControl();

  filteredFolders: Observable<any[]>;

  folders = [];

  videoSets = [];
  folderIdActive;

  @ViewChild('folderInput', { static: false }) folderInput: ElementRef;
  private objProject: any;
  private objSceneTagFolderRemoved: any;

  constructor(
    private spinner: SpinnerService,
    private reportService: ReportService
  ) {
    this.filteredFolders = this.folderCtrl.valueChanges.pipe(
      startWith(null),
      map((folderName: string | null) => folderName ? this.filter(folderName) : this.allFolder.slice()));
  }

  ngOnInit() {
    this.getProjectInfo(this.project.id);
    this.objProject = {
      projectId: this.project.id,
      folders: [],
      isRemovedFolder: false,
      sceneAfterChangeVideoSet: [],
      tagAfterChangeVideoSet: [],
      objSceneTagFolderRemoved: this.objSceneTagFolderRemoved
    };
  }

  ngOnDestroy() {
    this.objProject.folders.forEach(item => {
      this.remove(item);
    });
  }

  getProjectInfo(id) {
    this.spinner.show();
    this.reportService.getListFolderInProject(id).subscribe((res) => {
      this.allFolder = res;
      this.spinner.hide();
    }, () => {
      this.spinner.hide();
    });
  }


  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    const folder = this.allFolder.find(x => x.name.toLowerCase() === value.toLowerCase());
    if (folder) {
      this.folders.push(folder);
      this.allFolder = this.allFolder.filter(x => x.id !== folder.id);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.folderCtrl.setValue(null);
  }

  remove(folder: any): void {
    const index = this.folders.indexOf(folder);
    if (index >= 0) {
      this.folders.splice(index, 1);
    }
    this.reportService.getListVideoByFolder(folder.id).subscribe(res => {
      this.allVideoListMerge = this.allVideoListMerge.filter((video) => !res.find(re => +video.id === +re.id))
      if (res.length > 0) {
        res.forEach((video) => {
          video.checked = false;
          const data = {
            item: video,
            selectAll: {status: false},
            isRemove: true
          }
          const dataObjList = {
            checked: false,
            videoSet: video,
            selectAll: {status: false},
            id: this.folderIdActive
          }
          this.videoSetSelected(data);
          this.getListObjVideoSets(dataObjList);
        });
      } else {
        this.videoSelect.emit(null);
      }
    }, () => this.spinner.hide());

  }

  filter(folderName: any) {
    return this.allFolder.filter(el =>
      el.name.toLowerCase().indexOf(folderName.toLowerCase()) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const { id } = event.option;
    const folder = this.allFolder.find(x => x.id === +id);
    if (!this.folders.some(el => el.id === folder.id)) {
      this.folders.push(folder);
    }
    this.folderInput.nativeElement.value = '';
    this.folderInput.nativeElement.blur();
    this.folderCtrl.setValue(null);
  }

  getListObjVideoSets(objVideoSet: any) {
    const indexFolder = this.objProject.folders.findIndex(item => +item.id === +objVideoSet.id);
    if (objVideoSet.selectAll.status === true) {
      if (+indexFolder !== -1) {
        if (objVideoSet.selectAll.completed === true) {
          this.objProject.folders[indexFolder].videoSetsId = [...JSON.parse(JSON.stringify(objVideoSet.videoSet)).reverse()]
        } else {
          this.objProject.folders[indexFolder].videoSetsId = [];
        }
      } else {
        const addVideoSetToFolder = {
          id: objVideoSet.id,
          videoSetsId: JSON.parse(JSON.stringify(objVideoSet.videoSet)).reverse()
        };
        this.objProject.folders.push(addVideoSetToFolder);
      }
    } else {
      if (+indexFolder !== -1) {
        if (objVideoSet.checked) {
          const videoSetEmitObj = { id: objVideoSet.videoSet.id, name: objVideoSet.videoSet.name, checked: objVideoSet.checked };
          this.objProject.folders[indexFolder].videoSetsId.push(videoSetEmitObj);
        } else {
          this.objProject.folders[indexFolder].videoSetsId =
            this.objProject.folders[indexFolder].videoSetsId.filter(item => item.id !== objVideoSet.videoSet.id);

        }
      } else {
        const objNewFolder = {
          id: objVideoSet.id,
          videoSetsId: [
            {
              id: objVideoSet.videoSet.id,
              name: objVideoSet.videoSet.name,
              checked: objVideoSet.checked
            }
          ]
        };
        this.objProject.folders.push(objNewFolder);
      }
    }
    this.objProject.isRemovedFolder = false;
    this.listObjProjects.emit(this.objProject);
  }

  videoSetSelected(data: any) {
    const event = data.item;
    let clone = this.videoSets.filter(item => item.checked);
    if (data.selectAll.status === true) {
      if (data.selectAll.completed === true) {
        clone = event;
      } else {
        clone = [];
      }
    } else {
      if (this.videoSets.some((video) => video.id === event.id)) {
        clone = clone.filter((video) => video.id !== event.id);
      } else {
        if (event.checked) {
          clone.push(event);
        }
      }
    }
    this.videoSets = JSON.parse(JSON.stringify(clone));
    this.videoSelect.emit(data);
  }

  tagSelects(event: any) {
    this.tagSelect.emit(event);
  }

  getObjSceneTagFolderRemoved(objSceneTag: any) {
    this.objSceneTagFolderRemoved = objSceneTag;
  }

  sceneSelects(event: any) {
    this.sceneSelect.emit(event);
  }

  getSceneTagAfterChangeVideoSet(event: any) {
    this.sceneTagChangeVideoSet.emit({
      projectId: event.projectId,
      scenes: event.scenes,
      tags: event.tags
    });
  }

  getVideoListMerge(data: any) {
    this.allVideoListMerge = data;
  }

  folderIdMerge(id: number) {
    this.folderIdActive = id;
  }
}
