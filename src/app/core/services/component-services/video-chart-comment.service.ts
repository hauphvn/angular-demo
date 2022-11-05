// Use to listen/emit event between video and chart

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoChartCommentService {
  public scene: Subject<any>;
  public xmlId: Subject<any>;
  public xmlName: Subject<any>;
  public currentTime: BehaviorSubject<any>;
  public listSceneActive: BehaviorSubject<any>;
  public listCommentInVideo: BehaviorSubject<any>;
  public listCommentInChart: BehaviorSubject<any>;
  public timeCommentClick: BehaviorSubject<any>;
  public addCommentContextMenu: BehaviorSubject<any>;
  constructor() {
    this.scene = new Subject<any>();
    this.xmlId = new Subject<any>();
    this.xmlName = new Subject<any>();
    this.currentTime = new BehaviorSubject<any>(0);
    this.listSceneActive = new BehaviorSubject<any>([]);
    this.listCommentInVideo = new BehaviorSubject<any>([]);
    this.listCommentInChart = new BehaviorSubject<any>([]);
    this.timeCommentClick = new BehaviorSubject<any>({ timeInVideo: -1, sceneName: '' });
    this.addCommentContextMenu = new BehaviorSubject<any>({});
  }
}
