import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'app-cutvideo-controll-bar',
  templateUrl: './cutvideo-controll-bar.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./cutvideo-controll-bar.component.scss']
})
export class CutvideoControllBarComponent implements OnInit, OnChanges {
  @Output() changePlayClick = new EventEmitter<any>();
  @Output() nextBackClick = new EventEmitter<any>();
  @Input() isEnded;
  @Input() isShowPlayButton!: boolean;
  @Input() showTextTimeStart = false;
  @Input() stringStartTime!: string;
  @Input() videoTitle!: string;
  isPlay = false;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isEnded) {
      if (changes.isEnded.currentValue !== changes.isEnded.previousValue && changes.isEnded.currentValue) {
        this.isPlay = false;
      }
    }
  }

  // Handle next/back 0.01/1s
  changeTime(event: any, timeValue: number) {
    this.nextBackClick.emit(+timeValue);
  }

  // Handle and emit play/pause event
  changePlay(event, key) {
    this.isPlay = key;
    this.changePlayClick.emit(key);
  }
}
