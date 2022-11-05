import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { LineChartComponent } from '@app/modules/dashboard/components/line-chart/line-chart.component';
import { DateUtil } from '@app/shared/utils/date';

@Component({
  selector: 'app-cutlinechart-chartbox',
  templateUrl: './cutlinechart-chartbox.component.html',
  styleUrls: ['./cutlinechart-chartbox.component.scss']
})
export class CutlinechartChartboxComponent implements OnInit, AfterViewInit {
  constructor(
    private spinnerService: SpinnerService,
    private dateUtil: DateUtil,
    private videoChartService: VideoChartService
  ) {}

  @ViewChild(LineChartComponent, { static: true }) lineComponentInstance: LineChartComponent;

  @Input() lineInfo: any;
  @Output() bufferTimeChange = new EventEmitter<any>();
  @Output() isEditing = new EventEmitter<void>();
  currentTime = 0;
  maxTime = 0;

  formStartTimeLine: FormGroup;

  // Gantt chart sort/filter controls
  ngOnInit() {
    this.innitForm();
    if (this.lineInfo && this.lineInfo.data.length) {
      const finalDataIndex = this.lineInfo.data[0].data.length;
      this.maxTime = this.lineInfo.data[0].data[finalDataIndex - 1].time;
    }
  }

  ngAfterViewInit() {
    this.currentTime = this.lineInfo.bufferTime;
    this.lineComponentInstance.seekChart(this.currentTime);
    this.syncStartTimeControl();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.lineInfo && changes.lineInfo.currentValue !== changes.lineInfo.previousValue) {
      if (!!this.formStartTimeLine) {
        this.currentTime = this.lineInfo.bufferTime;
        this.formControl.startTimeLine.setValue(this.dateUtil.secondsToTime(this.currentTime));
      }
    }
  }

  get formControl() {
    return this.formStartTimeLine.controls;
  }

  innitForm() {
    this.formStartTimeLine = new FormGroup({
      startTimeLine: new FormControl({ value: this.dateUtil.secondsToTime(this.currentTime), disabled: true })
    });
  }

  handleNextBackClick(key: any) {
    if (this.currentTime < this.maxTime - key || key < 0) {
      this.isEditing.emit();
      this.currentTime = Number.parseFloat((this.currentTime + key).toFixed(2));
      this.syncStartTimeControl();
      this.lineComponentInstance.seekChart(this.currentTime);
      this.bufferTimeChange.emit({ ...this.lineInfo, bufferTime: this.currentTime });
    }
  }

  syncCurrentTime(time: any) {
    this.currentTime = Number.parseFloat(time.toFixed(2));
    this.syncStartTimeControl();
  }

  syncStartTimeControl() {
    const currentTime = this.dateUtil.secondsToTime(Math.abs(this.currentTime));
    const timeDisplay = this.currentTime >= 0 ? `${currentTime}` : ` -${currentTime}`;
    this.formControl.startTimeLine.setValue(timeDisplay);
  }
}
