import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { GanttChartComponent } from '@app/modules/dashboard/components/gantt-chart/gantt-chart.component';
import { FormControl, FormGroup } from '@angular/forms';
import { DateUtil } from '@app/shared/utils/date';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { of } from 'rxjs';

interface SceneCountObject {
  [key: string]: number;
}

@Component({
  selector: 'app-cutganttchart-chartbox',
  templateUrl: './cutganttchart-chartbox.component.html',
  styleUrls: ['./cutganttchart-chartbox.component.scss']
})
export class CutganttchartChartboxComponent implements OnInit, AfterViewInit {
  constructor(
    private spinnerService: SpinnerService,
    private dateUtil: DateUtil,
    private videoChartService: VideoChartService
  ) {}

  @ViewChild(GanttChartComponent, { static: true }) ganttComponentInstance: GanttChartComponent;
  @Input() xmlInfo: any;
  @Output() bufferTimeChange = new EventEmitter<any>();
  @Output() isEditing = new EventEmitter<void>();
  // for left side
  listXML: any[] = [];
  formStartTime: FormGroup;

  // for gantt
  taskTypes = { taskName: [], taskNameDisplay: [] };
  tasksFormated: any[] = [];
  numTypeOfXML: any[] = []; // store length unique array type of XML
  listXMLShowing: any[] = []; // data is showing
  maxTime: number;
  mileStoneDate = 0;
  currentTime = 0;
  areaId: any;

  isFirstInit = true;

  ngOnInit() {
    this.listXML = [];
    this.listXMLShowing = [];
    this.refreshArrayData();
    of(this.xmlInfo)
      .pipe(catchError(error => of(`Error: ${error}`)))
      .subscribe(xml => {
        this.formatTasks(this.xmlInfo);
      });
    this.videoChartService.refreshVideoData();
    this.innitForm();
    this.areaId = 'gantt-chart-area ' + `chart-${this.xmlInfo.id}`;
  }

  ngAfterViewInit() {
    this.ganttComponentInstance.buildGantt();
    this.currentTime = this.xmlInfo.bufferTime || 0;
    this.mileStoneDate = this.xmlInfo.bufferTime || 0;
    this.syncStartTimeControl();
    this.ganttComponentInstance.changeCurrentTime(this.currentTime);
  }

  ngOnchange(changes: SimpleChanges) {
    if (this.xmlInfo && changes.xmlInfo.currentValue !== changes.xmlInfo.previousValue) {
      this.currentTime = this.mileStoneDate;
      if (!!this.formStartTime) {
        this.formControl.startTime.setValue(this.dateUtil.secondsToTime(this.currentTime));
      }
    }
  }

  get formControl() {
    return this.formStartTime.controls;
  }

  innitForm() {
    this.formStartTime = new FormGroup({
      startTime: new FormControl({ value: this.dateUtil.secondsToTime(this.currentTime), disabled: true })
    });
  }

  refreshArrayData() {
    this.numTypeOfXML.length = 0;
    this.tasksFormated.length = 0;
    this.taskTypes.taskName.length = 0;
    this.taskTypes.taskNameDisplay.length = 0;
  }

  rebuildArrayData() {
    if (this.listXMLShowing.length > 0) {
      for (const xml of this.listXMLShowing) {
        this.formatTasks(xml);
      }
    }
  }

  formatTasks(xml: any) {
    // Format list to draw rect
    this.tasksFormated = this.tasksFormated.concat(xml.data);

    // Lists to build y label
    const temp = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskName')).map(t => t.taskName);
    this.taskTypes.taskName = this.taskTypes.taskName.concat(temp);
    this.taskTypes.taskName.push(`xml${xml.id}footer`);

    const temp1 = xml.data.filter((v, i, s) => this.onlyUnique(v, i, s, 'taskNameDisplay')).map(t => t.taskNameDisplay);
    this.taskTypes.taskNameDisplay = this.taskTypes.taskNameDisplay.concat(temp1);
    this.taskTypes.taskNameDisplay.push('');

    const length = temp.length + 1;
    this.numTypeOfXML.push({ name: xml.name, length });
  }

  // Remove all item that already exist
  onlyUnique(value, index, self, key) {
    return self.findIndex(i => i[key] === value[key]) === index;
  }

  getMaxEndDateTime(): number {
    return Math.max.apply(
      Math,
      this.tasksFormated.map(task => {
        return task.endDate;
      })
    );
  }

  handleNextBackClick(key: any) {
    this.isEditing.emit();
    if (this.mileStoneDate < this.getMaxEndDateTime() || key < 0) {
      this.mileStoneDate = Number.parseFloat((this.mileStoneDate + key).toFixed(2));
    }
    if (this.mileStoneDate <= this.getMaxEndDateTime()) {
      this.currentTime = this.mileStoneDate;
      this.syncStartTimeControl();
      this.ganttComponentInstance.changeCurrentTime(this.mileStoneDate);
      this.bufferTimeChange.emit({ ...this.xmlInfo, bufferTime: this.currentTime, isClickNextBack: true });
    }
  }

  syncCurrentTime(time: any) {
    this.currentTime = Number.parseFloat(time.toFixed(2));
    this.mileStoneDate = this.currentTime;
    this.syncStartTimeControl();
    if (!this.isFirstInit) {
      this.bufferTimeChange.emit({ ...this.xmlInfo, bufferTime: this.currentTime, isClickNextBack: false });
    } else {
      this.isFirstInit = false;
    }
  }

  syncStartTimeControl() {
    const currentTime = this.dateUtil.secondsToTime(Math.abs(this.currentTime));
    const timeDisplay = this.currentTime >= 0 ? `${currentTime}` : ` -${currentTime}`;
    this.formControl.startTime.setValue(timeDisplay);
  }
}
