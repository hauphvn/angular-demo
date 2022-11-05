import { Injectable } from '@angular/core';
import { DashboardModule } from '@app/modules/dashboard/dashboard.module';
import { ReplaySubject, Subject } from 'rxjs';

@Injectable()
export class GanttLineService {
  constructor() { }
  public ganttResize: ReplaySubject<number> = new ReplaySubject<number>(1);
  public ganttTimeRangeChange: ReplaySubject<number> = new ReplaySubject<number>(1);
  public startToMiddleRangeChange: ReplaySubject<number> = new ReplaySubject<number>(1);
  public ganttZoom: ReplaySubject<number> = new ReplaySubject<number>(1);
}
