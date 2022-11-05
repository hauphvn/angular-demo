import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { fromEvent } from 'rxjs';
import { DateUtil } from '@app/shared/utils/date';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';

@Component({
  selector: 'app-dashboard-slider',
  templateUrl: './dashboard-slider.component.html',
  styleUrls: ['./dashboard-slider.component.scss']
})
export class DashboardSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() min = 0;
  @Input() max = 1800;
  @Input() value = 5;
  @Input() cueList = [{ start: 0.5 }];
  @Output() valueChange = new EventEmitter<any>();

  slider;
  sliderX;
  sliderY;
  mouseup;
  mousedown;
  mouseover;
  mousemove;
  mouseleave;
  isHover = false;
  valueString = '';
  isMouseDown = false;

  widthSlider = 0;
  leftTooltip = 50;

  constructor(private dateUtil: DateUtil, private videoChartCommentService: VideoChartCommentService) {}

  ngOnInit() {
    this.valueString = this.dateUtil.secondsToTime(this.value);
    this.videoChartCommentService.listCommentInVideo.subscribe(list => (this.cueList = list));
  }

  ngAfterViewInit() {
    this.slider = document.getElementById('dashboard-slider-wrapper');
    const boundX = this.slider.getBoundingClientRect().left;
    this.widthSlider = this.slider.offsetWidth;
    this.mousemove = fromEvent(this.slider, 'mousemove');
    this.mousemove.subscribe((e: MouseEvent) => {
      this.leftTooltip = e.clientX - boundX;
      const temp = (this.max * this.leftTooltip) / this.widthSlider;
      this.valueString = this.dateUtil.secondsToTime(temp);
      if (this.isMouseDown) {
        this.value = temp;
        this.valueChange.emit(this.value);
      }
    });

    this.mouseover = fromEvent(this.slider, 'mouseover');
    this.mouseover.subscribe((e: MouseEvent) => {
      this.isHover = true;
    });

    this.mouseleave = fromEvent(this.slider, 'mouseleave');
    this.mouseleave.subscribe((e: MouseEvent) => {
      this.isHover = false;
      this.isMouseDown = false;
    });

    this.mouseup = fromEvent(this.slider, 'mouseup');
    this.mouseup.subscribe((e: MouseEvent) => {
      this.isMouseDown = false;
    });

    this.mousedown = fromEvent(this.slider, 'mousedown');
    this.mousedown.subscribe((e: MouseEvent) => {
      this.isMouseDown = true;
      const temp = (this.max * this.leftTooltip) / this.widthSlider;
      this.valueString = this.dateUtil.secondsToTime(temp);
      if (this.isMouseDown) {
        this.value = temp;
        this.valueChange.emit(this.value);
      }
    });
  }

  formatLabel(value: number) {
    const H = Math.floor(value / 3600);
    const M = Math.floor((value - 3600 * H) / 60);
    const S = Math.floor(value - H * 3600 - M * 60);
    const h = H > 9 ? H : '0' + H;
    const m = M > 9 ? M : '0' + M;
    const s = S > 9 ? S : '0' + S;
    if (H !== 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  }

  ngOnDestroy() {}

  style(cue) {
    const width = Math.max(2, this.widthSlider / this.max);
    return {
      left: `${(cue * 100) / this.max}%`,
      top: 0,
      width: `${width}px`
    };
  }
}
