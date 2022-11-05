// Use to listen/emit event between video and chart

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DateUtil } from '@app/shared/utils/date';
import { SceneBar, SceneBarParams } from '@app/shared/models/editXMLDataModel';

@Injectable({ providedIn: 'root' })
export class VideoChartService {
  public data: Subject<any>;
  public scene: Subject<number>;
  public ended: Subject<any>;
  public duration: BehaviorSubject<any>;
  public confirmMaxDuration: Subject<any>;
  public dataVideoChange: BehaviorSubject<any>;
  public maxValueVideo: BehaviorSubject<any>;
  private barSelected: any;

  sceneBarEdited: SceneBar = null;
  recordSceneBars: SceneBarParams[] = [];

  maxDuration = 0;
  readyStates: boolean[];
  endStates: boolean[];
  baseID;

  dataVideo = {
    play: false,
    pause: true,
    speed: 1,
    isSeek: false,
    isDragCentral: false,
    duration: 0,
    currentTime: 0,
    isTransition: true,
    isSeekFromChart: false,
    readyAll: false
  };

  constructor(private dateUtil: DateUtil) {
    this.data = new Subject<any>();
    this.ended = new Subject<any>();
    this.scene = new Subject<number>();
    this.duration = new BehaviorSubject<any>(0);
    this.dataVideoChange = new BehaviorSubject<any>(0);
    this.maxValueVideo = new BehaviorSubject<any>(0);
    this.confirmMaxDuration = new Subject<any>();
    this.readyStates = [];
    this.endStates = [];
  }

  public changeIsPlay(value: boolean) {
    this.dataVideo.play = value;
    this.dataVideo.pause = !value;
    this.dataVideo.isTransition = value;
    this.data.next(this.dataVideo);
  }

  public seek(seek: boolean, time: number, isDragCentralBar = false, isValidateWithoutBarSelected = true) {
    this.dataVideo.isSeek = seek;
    this.dataVideo.isTransition = !seek;
    this.dataVideo.isDragCentral = isDragCentralBar;
    if (isValidateWithoutBarSelected)
      time = this.validateTimeWithBarSelected(time);
    this.dataVideo.currentTime = isNaN(time) ? 0 : time;
    this.data.next(this.dataVideo);
  }

  public seekAddition(timeAdd: number) {
    this.dataVideo.isSeek = true;
    this.dataVideo.isTransition = false;
    this.dataVideo.currentTime += timeAdd;
    this.dataVideo.currentTime = this.validateTimeWithBarSelected(this.dataVideo.currentTime);
    this.dataVideo.currentTime = Math.max(0, this.dataVideo.currentTime);
    this.dataVideo.currentTime = Math.min(this.dataVideo.currentTime, this.maxDuration);
    this.data.next(this.dataVideo);
  }

  public changeReady(idVid: number, state: boolean) {
    this.readyStates[idVid] = state;
    this.dataVideo.readyAll = this.readyStates.reduce((x, y) => x && y);
    this.data.next(this.dataVideo);
  }

  changeEndState(idVid: number, state: boolean) {
    this.endStates[+idVid] = state;
    const endState = this.endStates.reduce((x, y) => x && y);
    if (endState) {
      this.dataVideo.readyAll = false;
    }
  }

  seekEnd() {
    this.dataVideo.isSeek = false;
    this.dataVideo.isDragCentral = false;
  }

  changeScene(value) {
    this.scene.next(value);
  }

  public changeSpeed(value) {
    this.dataVideo.speed = value;
    this.data.next(this.dataVideo);
  }

  public timeUpdate(time, videoID) {
    // Only base videos is accepted to raise event
    // Time will depend on time of base video
    if (videoID === this.baseID) {
      this.dataVideo.currentTime = time;
      this.dataVideo.currentTime = Math.max(0, this.dataVideo.currentTime);
      if (this.sceneBarEdited)
        this.sceneBarEdited.endTime = this.dataVideo.currentTime;
    this.data.next(this.dataVideo);
    }
  }
  public timeNegativeUpdate(time) {
    this.dataVideo.currentTime = time;
    this.data.next(this.dataVideo);
  }

  public changeDuration(duration, bufferTime, videoID) {
    // Receive all duration change from videos
    if (duration - bufferTime > this.maxDuration) {
      this.maxDuration = duration - bufferTime;
      this.duration.next(duration - bufferTime);
      this.dataVideo.duration = Math.floor(duration- bufferTime);
      this.baseID = videoID;
      // Emit confirm max duration
      this.confirmMaxDuration.next(videoID);
    }
    this.readyStates[+videoID] = false;
    this.endStates[+videoID] = false;
  }

  public videoEnded(videoID) {
    // Only base video is accepted raise this event
    if (videoID === this.baseID) {
      this.ended.next(true);
    }
  }

  public refreshVideoData() {
    this.dataVideo = {
      play: false,
      pause: true,
      speed: 1,
      isSeek: false,
      isDragCentral: false,
      duration: 0,
      currentTime: 0,
      isTransition: true,
      isSeekFromChart: false,
      readyAll: false
    };
    this.maxDuration = 0;
    this.readyStates = [];
    this.endStates = [];
    this.barSelected = {};
  }

  getData(): Observable<any> {
    return this.data.asObservable();
  }

  setBarSelected(value: any) {
    this.barSelected = value;
  }

  getBarSelectedSceneName() {
    const sceneName = this.barSelected && this.barSelected.taskNameDisplay ? this.barSelected.taskNameDisplay : '';
    return sceneName;
  }

  getBarSelectedBarStartTimeInSeconds() {
    return this.barSelected.startDate;
  }

  isOverSelectBar(time: number) {
    return this.barSelected && this.barSelected.endDate && time > this.barSelected.endDate;
  }

  validateTimeWithBarSelected(time: number) {
    if (this.barSelected && this.barSelected.id) {
      time = Math.min(this.barSelected.endDate, time);
      time = Math.max(this.barSelected.startDate, time);
    }
    return time;
  }
}
