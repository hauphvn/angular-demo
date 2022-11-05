import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateUtil } from '@app/shared/utils/date';

@Component({
  selector: 'app-cutvideo-videobox',
  templateUrl: './cutvideo-videobox.component.html',
  styleUrls: ['./cutvideo-videobox.component.scss']
})
export class CutvideoVideoboxComponent implements OnInit, OnChanges {
  @Input() videoInfo;
  @Input() isCutting;
  @Output() bufferTimeChange = new EventEmitter<any>();
  @Output() isEditing = new EventEmitter<void>();
  @ViewChild('videoElement', {static: true}) videoElement: HTMLVideoElement;

  constructor(private dateUtil: DateUtil) {
  }
  private media: any;
  previousTime = 0;
  currentTime = 0;
  isEnded = false;
  formStartTime: FormGroup;
  delayTime = 0;
  delayValue = 1;
  percent = 100;
  timer: any;
  bufferTime: number;
  currentTimeOnPlayer: any;
  totalTime = 'NaN';
  mobileMedia: any = window.matchMedia('(max-width:86.625em)');
  isMobileDevice = false;

  ngOnInit() {
    this.checkClientDevice();
    this.innitForm();
    this.currentTimeOnPlayer = this.dateUtil.secondsToTime(this.currentTime, false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.videoInfo && changes.videoInfo.currentValue !== changes.videoInfo.previousValue) {
      this.currentTime = this.videoInfo.bufferTime;
      if (!!this.formStartTime) {
        this.formControl.startTime.setValue(this.dateUtil.secondsToTime(this.currentTime));
      }
    }
  }

  innitForm() {
    // Init form object and validate
    this.formStartTime = new FormGroup({
      startTime: new FormControl({ value: this.dateUtil.secondsToTime(this.currentTime), disabled: true })
    });
  }

  get formControl() {
    return this.formStartTime.controls;
  }

  onPlayerReady(event) {
    this.media = event.getDefaultMedia();
    // hanlde negative time
    if (this.videoInfo.bufferTime < 0) {
      this.delayTime = Math.abs(this.videoInfo.bufferTime) * this.percent;
      this.displayStartTime(this.delayTime / this.percent);
    }
    this.media.seekTime(this.videoInfo.bufferTime); // fire only one in ready
    this.media.subscriptions.timeUpdate.subscribe(e => {
      this.currentTime = this.media.currentTime;
      if (this.currentTime !== this.previousTime) {
        this.previousTime = this.currentTime;
        this.formControl.startTime.setValue(this.dateUtil.secondsToTime(this.currentTime));
        this.delayTime = 0;
        this.emitBufferTime();
        this.currentTimeOnPlayer = this.dateUtil.secondsToTime(this.currentTime);
        if (this.dateUtil.secondsToTime(this.currentTime) !== this.dateUtil.secondsToTime(this.videoInfo.bufferTime)) {
            if (!this.isCutting) {
              this.isEditing.emit();
            }
        }
      }
    });

    this.media.subscriptions.ended.subscribe(e => {
      this.isEnded = true;
    });
  }

  handleChangePlayClick(key) {
    if (!!this.media) {
      // display interval milisecond in start-time input.
      this.media.subscriptions.timeUpdate.subscribe(() => {
        this.currentTime = this.media.currentTime;
        this.formControl.startTime.setValue(this.dateUtil.secondsToTime(this.media.currentTime,));
        this.currentTimeOnPlayer = this.formControl.startTime.value;
        this.emitBufferTime();
      });
      if (key) {
        if (this.delayTime > 0) {
          this.media.pause();
          // delay video for selected time
          this.timer = setInterval(() => {
            if (this.delayTime === this.delayValue) {
              clearInterval(this.timer);
              this.media.currentTime = 0;
              this.syncData();
              this.media.play();
            }
            const interval = this.delayTime -= this.delayValue;
            this.displayStartTime(interval / this.percent);
          }, this.percent / 10);
        } else {
          this.media.play();
          this.isEnded = false;
        }
      } else {
        // stop interval when pause button clicked
        clearInterval(this.timer);
        this.media.pause();
      }
    }
  }

  handleNextBackClick(interval: number) {
    this.isEditing.emit();
    this.currentTime += interval;
    if (interval < 0) {
      // prev 0.01s
      if (this.currentTime < 0) {
        // increase video delay time
        this.delayTime += Math.abs(interval);
        // display nagative time in start-time input
        this.displayStartTime(Number((this.currentTime).toFixed(2)));
        this.emitBufferTime();
      } else {
        // sync current time with media current time, emit buffer time
        this.syncData();
      }
    } else {
      if (this.delayTime > 0) {
        // decrease video delay time
        this.delayTime -= Math.abs(interval);
        this.displayStartTime(Number((this.currentTime).toFixed(2)));
        this.emitBufferTime();
      } else {
        // next 0.01s
        this.syncData();
      }
    }
  }

  syncData() {
    this.media.subscriptions.timeUpdate.subscribe(() => {
      this.currentTime = this.media.currentTime;
      this.formControl.startTime.setValue(this.dateUtil.secondsToTime(this.currentTime));
      this.emitBufferTime();
    });
    this.media.seekTime(this.currentTime);
  }

  emitBufferTime() {
    const currentBufferTime = this.currentTime;
    this.bufferTimeChange.emit({ id: this.videoInfo.id, bufferTime: this.roundTime(currentBufferTime) });
  }

  roundTime(time: number) {
    return Number.parseFloat((time).toFixed(2));
  }

  displayStartTime(second: number) {
    const fullTime = `${this.dateUtil.secondsToTime(Math.abs(second))}`;
    const startTime = (this.currentTime < 0) ? `-${fullTime}` : fullTime;
    this.formControl.startTime.setValue(startTime);
  }

  onVideoMetaData(video) {
    if (!!video) {
      this.totalTime = this.dateUtil.secondsToTime(video.duration);
    }

  }

  private checkClientDevice() {
    if (this.mobileMedia.matches) {
      this.isMobileDevice = true;
    } else {
      this.isMobileDevice = false;
    }
  }
}
