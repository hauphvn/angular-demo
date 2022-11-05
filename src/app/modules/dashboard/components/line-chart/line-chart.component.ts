import { VideoChartService } from './../../../../core/services/component-services/video-chart.service';
import { LineChartService } from './line-chart.service';
import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  OnChanges,
  ElementRef,
  ViewChild,
  SimpleChanges,
  AfterViewChecked
} from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TimeSeriesLineItemModel } from '@app/shared/models/dashboardModel';
import { GanttLineService } from '@app/core/services/component-services/gantt-line.service';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  providers: [LineChartService]
})
export class LineChartComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() id: string;
  @Input() data: TimeSeriesLineItemModel[];
  @Input() syncGanttChart = true;
  @Input() bufferTimeLine: number;
  @ViewChild('lineChartArea', { static: false }) lineChartArea: ElementRef;
  constructor(
    public lineService: LineChartService,
    private videoChartService: VideoChartService,
    private ganttLineService: GanttLineService
  ) { }

  // Array clone
  arrClone;
  // Filter data to show
  listDataOption: TreeNode[] = [];
  selectedOptions: TreeNode[] = [];
  listLineToDrawInChart: TimeSeriesLineItemModel[] = [];
  lineSpeed = 1;

  clientWidthChart = 0;
  ngOnInit(): void {
    if (this.bufferTimeLine < 0) {
      this.lineService.changePaddingLeftXscale(Math.abs(this.bufferTimeLine)*12);
    } else {
      this.lineService.changePaddingLeftXscale(0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data && changes.data.currentValue !== changes.data.previousValue) {
      this.listDataOption = this.data.map((d, i) => {
        return { label: d.name, key: `${i}`, selectable: i < 10, styleClass: 'line-chart_filter-node' };
      });
      this.selectedOptions = this.listDataOption.slice(0, 10);
      this.listLineToDrawInChart = this.selectedOptions.map(dataToShow => this.data[dataToShow.key]);
      // this.data.splice(10); // Demo only
      this.videoChartService.maxValueVideo.next(this.lineService.findMaxvalue(this.listLineToDrawInChart));
      this.lineService.handleDataChange(this.listLineToDrawInChart);

      this.arrClone = JSON.parse(JSON.stringify(this.listLineToDrawInChart));
    }
  }

  ngAfterViewInit() {
    const { clientWidth, id } = this.lineChartArea.nativeElement;
    this.clientWidthChart = clientWidth;
    this.lineService.setDomainStart(0);
    this.lineService.setDomainEnd(90);
    this.lineService.createLineChart({ id, containerWidth: clientWidth, containerHeight: 200 });

    if (this.syncGanttChart) {
      this.videoChartService.getData().subscribe(res => {
        if (res.speed - this.lineSpeed) {
          this.lineSpeed = res.speed;
          this.lineService.setLineSpeed(this.lineSpeed);
        }
        if (res.play && !res.isSeek) {
          this.lineService.setCurrentTime(res.currentTime + 1);
          this.lineService.updateChart(true);
        } else if (res.isSeek && !res.isDragCentral) {
          this.lineService.setCurrentTime(res.currentTime);
          setTimeout(() => {
            this.lineService.updateChart(false);
          }, 0);
        }
        if (!res.play || res.isSeek) {
          // this.lineService.clearTransition();
        }
      });
    }

    this.ganttLineService.ganttResize.subscribe((newLeftSize: number) => {
      this.lineService.leftResize(newLeftSize);
    });
    this.ganttLineService.ganttTimeRangeChange.subscribe(newRange => {
      this.lineService.setTimeRange(newRange);
      this.lineService.updateChart(false);
    });

    this.ganttLineService.ganttZoom.subscribe(kZoom => {
      this.handleZoom(kZoom);
    });

    this.ganttLineService.startToMiddleRangeChange.subscribe(newStartTimeToMiddleRange => {
      this.lineService.setStartTimeToMiddleTimeRange(newStartTimeToMiddleRange);
      this.lineService.updateChart(false);
    });
  }

  handleItemClick(line): void {
    const index = this.arrClone.findIndex(x => x.id === line.id);

    if (this.arrClone.length > 1 || !line.isActive) {
      line.isActive = !line.isActive;
      if (!line.isActive) {
        this.arrClone.splice(index, 1);
      } else {
        this.arrClone.splice(index, 0, line);
      }
    }
    this.lineService.handleDataChange(this.arrClone);
  }

  handleFilterChart() {
    this.listLineToDrawInChart = this.selectedOptions.map(dataToShow => this.data[dataToShow.key]);
    // this.data.splice(10); // Demo only
    this.videoChartService.maxValueVideo.next(this.lineService.findMaxvalue(this.listLineToDrawInChart));
    this.lineService.handleDataChange(this.listLineToDrawInChart);

    this.arrClone = JSON.parse(JSON.stringify(this.listLineToDrawInChart));
  }

  updateListOption(event: TreeNode, isSelectNode: boolean) {
    const isMaxOptionSelected = this.selectedOptions.length === 10;

    if (isMaxOptionSelected) {
      // Max options selected
      // Disable others
      for (const option of this.listDataOption) {
        const isOptionSelected = this.selectedOptions.find(selectedOption => selectedOption.key === option.key);
        if (!isOptionSelected) {
          // Disable other options
          option.selectable = false;
        }
      }
    } else {
      for (const option of this.listDataOption) {
        option.selectable = true;
      }
    }
  }

  seekChart(time: number) {
    if (time || time === 0) {
      this.lineService.setCurrentTime(time);
      this.lineService.updateChart(false);
    }
  }

  handleZoom(kZoom: number) {
    if (this.lineService) {
      this.lineService.changeKZoom(kZoom);
      this.lineService.updateChart();
    }
  }
}
