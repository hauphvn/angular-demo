import { Component, OnInit, ViewEncapsulation, Input, OnDestroy } from '@angular/core';
import { Subscription, of, interval } from 'rxjs';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { tap, delay, take } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-video',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard-video.component.html',
  styleUrls: ['./dashboard-video.component.scss']
})
export class DashboardVideoComponent implements OnInit, OnDestroy {
  @Input() idVid: string;
  @Input() videoConfig;
  @Input() videoList;
  timer: any;
  // @Input() videoSource: string;
  // @Input() bufferTime = 0; // buffer time in seconds
  isPlay = false;
  currentTimeRs=0;
  isShowTimelineVirtual = true;
  timerInterval: any;
  rsState: any;
  idVidMax = -1;

  sub: Subscription;
  private media: any;
  private previousTime;
  private durationVideo;
  private isBaseVideo = false;
  constructor(private videoChartService: VideoChartService, private spinner: SpinnerService) {
    this.sub = this.videoChartService.getData().subscribe(rs => {
      const { state } = this.media;
      this.rsState = rs;
      const timeout = 1000/rs.speed;
      if (this.media.playbackRate !== rs.speed) {
        this.media.playbackRate = rs.speed;
      }
      if (this.idVidMax >= 0 && this.idVidMax === Number(this.idVid) && this.videoList[this.idVidMax].bufferTime < 0) { // max video âm
        if (this.currentTimeRs > rs.currentTime && this.currentTimeRs >= Math.abs(this.videoList[this.idVidMax].bufferTime)) {
          this.isShowTimelineVirtual = true;
        }
        this.currentTimeRs = rs.currentTime;
        if (
          rs.play &&
          rs.currentTime + Number(this.videoList[this.idVidMax].bufferTime) <= this.durationVideo &&
          rs.currentTime >= 0 &&
          rs.readyAll &&
          (state === 'paused' || state === 'ended')
        ) {
          if (this.videoList[this.idVidMax].bufferTime) {
            if (rs.currentTime < Math.abs(this.videoList[this.idVidMax].bufferTime) && this.isShowTimelineVirtual) {
              this.isShowTimelineVirtual = false;
              this.showTimeLineVirtual();
            }
            const timeDelay = ((rs.currentTime < Math.abs(this.videoList[this.idVidMax].bufferTime) ? Math.abs(this.videoList[this.idVidMax].bufferTime) : 0) * timeout);
            if (this.timer) {
              this.timer.unsubscribe();
            }
            const observablePattern = of(true).pipe(
              delay(timeDelay),
              tap(() => {
                if (rs.play) {
                  this.media.play();
                  this.isPlay = true;
                }
              })
            )
            this.timer = observablePattern.subscribe(() => {
              this.timer.unsubscribe();
            })
          }
        }
      } else if (this.idVidMax >= 0 && this.idVidMax === Number(this.idVid) && this.videoList[this.idVidMax].bufferTime >= 0) { // max video dương
        if (
          rs.play &&
          rs.currentTime + Number(this.videoConfig.bufferTime) <= this.durationVideo &&
          rs.currentTime >= 0 &&
          rs.readyAll &&
          (state === 'paused' || state === 'ended')
        ) {
          this.media.play();
          this.isPlay = true;
        }
      } else { // 2 video còn lại
        if (
          rs.play &&
          rs.currentTime + Number(this.videoConfig.bufferTime) <= this.durationVideo &&
          rs.currentTime >= 0 &&
          rs.readyAll &&
          (state === 'paused' || state === 'ended')
        ) {
          if (Number(this.videoConfig.bufferTime) < 0) {
            const timeDelay = ((rs.currentTime < Math.abs(this.videoConfig.bufferTime) ? Math.abs(this.videoConfig.bufferTime) : 0) * timeout);
            if (this.timer) {
              this.timer.unsubscribe();
            }
            const observablePattern = of(true).pipe(
              delay(timeDelay),
              tap(() => {
                if (rs.play) {
                  this.media.play();
                  this.isPlay = true;
                }
              })
            )
            this.timer = observablePattern.subscribe(() => {
              this.timer.unsubscribe();
            })
          } else {
            this.media.play();
            this.isPlay = true;
          }
        }
      }

      // end playing
      if ((rs.pause || !rs.readyAll) && state === 'playing') {
        this.media.pause();
        this.isPlay = false;
        if (this.timer) {
          this.timer.unsubscribe();
        }
      }
      if (rs.isSeek) {
        let timeToSeek = rs.currentTime + Number(this.videoConfig.bufferTime);
        if (this.videoChartService.isOverSelectBar(timeToSeek)) {
          timeToSeek =
            this.videoChartService.getBarSelectedBarStartTimeInSeconds() + Number(this.videoConfig.bufferTime);
        }
        if (!isNaN(timeToSeek))
          this.media.seekTime(timeToSeek);
      }
    });
  }

  showTimeLineVirtual() {
    const numbers = interval(1000/this.rsState.speed);
    const numberInterval = this.idVidMax >= 0 && numbers.pipe(take(Math.abs(Math.floor(this.videoList[this.idVidMax].bufferTime)) - Math.floor(this.rsState.currentTime)));

    this.timerInterval = numberInterval.subscribe(x => {
      if (this.rsState.pause) {
        this.timerInterval.unsubscribe();
        this.isShowTimelineVirtual = true;
        if (this.timer) {
          this.timer.unsubscribe();
        }
      } else {
        this.videoChartService.timeNegativeUpdate(this.rsState.currentTime + 1);
      }
      if (x === ((Math.abs(this.videoList[this.idVidMax].bufferTime) - Math.floor(this.rsState.currentTime)) - 1)) {
        this.isShowTimelineVirtual = true;
      }
    });
  }

  ngOnInit() { }

  onPlayerReady(event) {
    this.videoChartService.refreshVideoData();
    this.media = event.getDefaultMedia();
    const bufferTime = Number(this.videoConfig.bufferTime);
    this.media.seekTime(bufferTime); // fire only one in ready
    this.media.subscriptions.timeUpdate.subscribe(t => {
      const time = Math.floor(this.media.currentTime);
      if (this.idVidMax >= 0 && this.idVidMax === Number(this.idVid) && Number(this.videoList[this.idVidMax].bufferTime) < 0) { // max video âm
        if ((time !== this.previousTime || time === 0) && this.currentTimeRs >= Math.abs(Number(this.videoList[this.idVidMax].bufferTime))) {
          this.previousTime = time;
          this.videoChartService.timeNegativeUpdate(this.media.currentTime - Number(this.videoList[this.idVidMax].bufferTime));
        }
      } else if (this.idVidMax >= 0 && this.idVidMax === Number(this.idVid) && Number(this.videoList[this.idVidMax].bufferTime) >= 0) { // max video dương
        this.videoChartService.timeUpdate(this.media.currentTime - bufferTime, this.idVid);
      }
    });
    this.media.subscriptions.durationChange.subscribe(e => {
      this.durationVideo = Math.floor(this.media.duration);
      this.videoChartService.changeDuration(this.media.duration, bufferTime, this.idVid);
    });

    this.videoChartService.confirmMaxDuration.subscribe(id => {
      if (id === this.idVid) {
        this.isBaseVideo = true;
      } else {
        this.isBaseVideo = false;
      }
    });
    this.media.subscriptions.ended.subscribe(e => {
      this.videoChartService.videoEnded(this.idVid);
    });

    this.media.subscriptions.canPlay.subscribe(e => {
      this.videoChartService.changeReady(+this.idVid, true);
    });

    this.media.subscriptions.waiting.subscribe(e => {
      this.videoChartService.changeReady(+this.idVid, false);
    });

    this.media.subscriptions.stalled.subscribe(e => {
      this.media.seekTime(this.media.currentTime - 1);
    });

    this.media.subscriptions.loadedData.subscribe(e => {
      // this.spinner.hide();
    });
    // this.media.subscriptions.suspend.subscribe(e => {
    //   // Event raise when browser no longer recive media data
    //   // Trigger it to try to play continues
    //   // Only trigger when video is paused by waiting another
    //   // and canPlay is true
    //   if (this.media.canPlay && this.media.state === 'paused') {
    //     this.videoChartService.changeReady(+this.idVid, true);
    //   }
    // });
    setTimeout(() => { // get id video max
      this.videoChartService.duration.subscribe(d => {
      const maxTime = Math.floor(d);
      const bufferTimeVideo = Number(this.videoConfig.bufferTime);
        if (Math.floor(this.media.duration - bufferTimeVideo) === maxTime) {
          this.spinner.hide();
          this.idVidMax = Number(this.idVid);
        }
      });
    }, 2000);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
