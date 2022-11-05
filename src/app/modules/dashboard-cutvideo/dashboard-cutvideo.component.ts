import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { messageConstant, NAVIGATE } from '@app/configs/app-constants';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { DateUtil } from '@app/shared/utils/date';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-dashboard-cutvideo',
  templateUrl: './dashboard-cutvideo.component.html',
  styleUrls: ['./dashboard-cutvideo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardCutvideoComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private spinnerService: SpinnerService,
    private dialogService: DialogService,
    private dateUtil: DateUtil,
    private toast: ToastrService,
    private dialog: DialogService
  ) {}
  enableSaveVideo = false;
  enableSaveXml = false;
  enableSaveTimeseries = false;
  videoId;
  videoList;

  bufferSaveList: any[] = [];
  bufferXmlSaveList: any[] = [];
  bufferTimeseriesSaveList: any[] = [];

  // for cut gantt
  listXML: any[] = [];
  listTimeseries: any[] = [];
  xmlData: any;
  timeSeriesData: any;
  xmlChosen = '';
  csvChosen = '';
  isCutting = false;
  xmlDataInvalid = [];
  timeSeriesInvalid = [];

  ngOnInit() {
    this.videoId = this.route.snapshot.paramMap.get('videoId');
    this.videoList = [];
    this.spinnerService.show();
    this.getAllData().subscribe(([resXML, resVideo, resTimeSeries]) => {
      if (resVideo instanceof HttpErrorResponse) {
        if (resVideo.status === 400) {
          this.spinnerService.hide();
          const param = {
            type: 'info',
            title: '',
            message: 'Video data title does not exist on system'
          };
          this.dialog.info(param).subscribe(res => {
            if (res) {
              this.router.navigate([`/${NAVIGATE.VIDEO_MANAGEMENT}`]);
            }
          });
        }
        this.spinnerService.hide();
      }
      this.videoList = resVideo.videos;
      this.videoList.map(v => {
        v.additionalDate = this.dateUtil.convertTimeZone(v.additionalDate, environment.timeZone);
      });
      // XML data response
      if (resXML instanceof HttpErrorResponse) {
        this.listXML = [];
      } else {
        this.listXML = resXML;
      }
      if (this.listXML.length > 0) {
        this.listXML[0].select = true;
        this.getXMLMetaData(this.listXML[0].id);
      } else {
        this.spinnerService.hide();
      }
      // CSV data response
      if (resTimeSeries instanceof HttpErrorResponse) {
        this.listTimeseries = [];
      } else {
        this.listTimeseries = resTimeSeries;
      }
      if (this.listTimeseries.length > 0) {
        this.listTimeseries[0].select = true;
        this.getTimeSeriesDetailData(this.listTimeseries[0].id);
      }
    });
  }

  getAllData() {
    const taskGetData = [];
    taskGetData.push(this.dashboardService.getXMLData(this.videoId).pipe(catchError(error => of(error))));
    taskGetData.push(this.dashboardService.getVideoData(this.videoId).pipe(catchError(error => of(error))));
    taskGetData.push(this.dashboardService.getListTimeSeriesData(this.videoId).pipe(catchError(error => of(error))));
    return forkJoin(...taskGetData);
  }

  getXMLMetaData(id: any) {
    this.xmlData = undefined;
    this.dashboardService.getXMLMetaData(id).subscribe(
      xml => {
        // mock start time for xml chart
        this.xmlData = xml;
        this.xmlChosen = xml.name;
        this.bufferXmlSaveList = [];
        this.spinnerService.hide();
      },
      error => {
        if (error.status === 400) {
          if (this.xmlDataInvalid.indexOf(id) === -1) {
            this.xmlDataInvalid = [...this.xmlDataInvalid, id];
          }
        }
        this.spinnerService.hide();
      }
    );
  }

  getTimeSeriesDetailData(id: string) {
    this.dashboardService.getSeriesDetailData(id).subscribe(
      res => {
        this.timeSeriesData = res;
        this.csvChosen = res.name;
        this.bufferTimeseriesSaveList = [];
        this.spinnerService.hide();
      },
      error => {
        if (error.status === 400) {
          if (this.timeSeriesInvalid.indexOf(id) === -1) {
            this.timeSeriesInvalid = [...this.timeSeriesInvalid, id];
          }
        }
        this.spinnerService.hide();
      }
    );
  }

  handleSelectXML(xmlId: number) {
    if (this.xmlDataInvalid.indexOf(xmlId) === -1) {
      if (this.bufferXmlSaveList && this.bufferXmlSaveList.length > 0) {
        const param = {
          type: 'confirm',
          title: 'CONFIRM',
          message: 'Your edit contents will not be saved ?'
        };
        this.dialogService.confirm(param).subscribe(result => {
          if (result) {
            this.spinnerService.show();
            this.getXMLMetaData(xmlId);
          }
        });
      } else {
        this.spinnerService.show();
        this.getXMLMetaData(xmlId);
      }
    }
  }

  handleSelectTimeseries(timeseriesId: string) {
    if (this.timeSeriesInvalid.indexOf(timeseriesId) === -1) {
      if (this.bufferTimeseriesSaveList && this.bufferTimeseriesSaveList.length) {
        const param = {
          type: 'confirm',
          title: 'CONFIRM',
          message: 'Your edit contents will not be saved ?'
        };
        this.dialogService.confirm(param).subscribe(result => {
          if (result) {
            this.spinnerService.show();
            this.timeSeriesData = null;
            this.getTimeSeriesDetailData(timeseriesId);
          }
        });
      } else {
        this.spinnerService.show();
        this.timeSeriesData = null;
        this.getTimeSeriesDetailData(timeseriesId);
      }
    }
  }

  handleBufferVideoTimeChange(event) {
    const indexInBuffer = this.bufferSaveList.findIndex(b => b.id === event.id);
    if (indexInBuffer !== -1) {
      this.bufferSaveList[indexInBuffer].bufferTime = event.bufferTime;
    } else {
      this.bufferSaveList.push(event);
    }
  }

  handleSaveClick() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save contents change?'
    };
    this.dialogService.confirm(param).subscribe(result => {
      if (result) {
        this.spinnerService.show();
        if (this.bufferSaveList.length !== 0) {
          const taskSave = [];
          this.bufferSaveList.forEach(ele => {
            taskSave.push(this.dashboardService.saveVideoData(ele.id, ele.bufferTime).pipe(catchError(err => of(err))));
          });
          forkJoin(...taskSave).subscribe(res => {
            let isError = false;
            for (const e of res) {
              if (e instanceof HttpErrorResponse) {
                isError = true;
                break;
              }
            }
            if (isError) {
              this.spinnerService.hide();
              this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
            } else {
              this.bufferSaveList = [];
              // Saving editing xml
              if (this.bufferXmlSaveList.length !== 0) {
                this.dashboardService
                  .saveXMLData(this.xmlData.id, this.xmlData.bufferTime)
                  .pipe(catchError(err => of(err)))
                  .subscribe(resXML => {
                    if (res instanceof HttpErrorResponse) {
                      this.spinnerService.hide();
                      this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
                    } else {
                      this.bufferXmlSaveList = [];
                      // Saving editing csv
                      if (this.bufferTimeseriesSaveList.length) {
                        this.dashboardService
                          .saveTimeseriesData(this.timeSeriesData.id, this.timeSeriesData.bufferTime)
                          .pipe(catchError(err => of(err)))
                          .subscribe(resCSV => {
                            if (res instanceof HttpErrorResponse) {
                              this.spinnerService.hide();
                              this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
                            } else {
                              this.isCutting = false;
                              this.spinnerService.hide();
                              this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                              this.bufferTimeseriesSaveList = [];
                            }
                          });
                      } else {
                        this.bufferXmlSaveList = [];
                        this.spinnerService.hide();
                        this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                      }
                    }
                  });
              } else if (this.bufferTimeseriesSaveList.length !== 0) {
                this.dashboardService
                  .saveTimeseriesData(this.timeSeriesData.id, this.timeSeriesData.bufferTime)
                  .pipe(catchError(err => of(err)))
                  .subscribe(resCSV => {
                    if (resCSV instanceof HttpErrorResponse) {
                      this.spinnerService.hide();
                      this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
                    } else {
                      this.isCutting = false;
                      this.spinnerService.hide();
                      this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                      this.bufferTimeseriesSaveList = [];
                    }
                  });
              } else {// Saving video data success
                this.isCutting = false;
                this.spinnerService.hide();
                this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
              }
            }
          });
        } else if (this.bufferXmlSaveList.length !== 0) {
          this.dashboardService
            .saveXMLData(this.xmlData.id, this.xmlData.bufferTime)
            .pipe(catchError(err => of(err)))
            .subscribe(resXML => {
              if (resXML instanceof HttpErrorResponse) {
                this.spinnerService.hide();
                this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
              } else {
                this.bufferXmlSaveList = [];
                // Saving editing csv
                if (this.bufferTimeseriesSaveList.length !== 0) {
                  this.dashboardService
                    .saveTimeseriesData(this.timeSeriesData.id, this.timeSeriesData.bufferTime)
                    .pipe(catchError(err => of(err)))
                    .subscribe(resCSV => {
                      if (resCSV instanceof HttpErrorResponse) {
                        this.spinnerService.hide();
                        this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
                      } else {
                        this.isCutting = false;
                        this.spinnerService.hide();
                        this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                        this.bufferTimeseriesSaveList = [];
                      }
                    });
                } else {
                  this.isCutting = false;
                  this.spinnerService.hide();
                  this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                }
              }
            });
        } else if (this.bufferTimeseriesSaveList.length !== 0) {
          this.dashboardService
            .saveTimeseriesData(this.timeSeriesData.id, this.timeSeriesData.bufferTime)
            .pipe(catchError(err => of(err)))
            .subscribe(resCSV => {
              if (resCSV instanceof HttpErrorResponse) {
                this.spinnerService.hide();
                this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
              } else {
                this.isCutting = false;
                this.spinnerService.hide();
                this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                this.bufferTimeseriesSaveList = [];
              }
            });
        }
      }
    });
  }

  handleCancelClick() {
    this.router.navigate([`/${NAVIGATE.DASHBOARD}`], { queryParams: { videoID: this.videoId } });
  }

  handleBufferXmlTimeChange(event: any) {
    if (event && !!event.isClickNextBack) {
      this.xmlData.bufferTime = event.bufferTime;
      const indexInBuffer = this.bufferXmlSaveList.findIndex(b => b.id === event.id);
      if (indexInBuffer !== -1) {
        this.bufferXmlSaveList[indexInBuffer] = event;
      } else {
        this.bufferXmlSaveList.push(event);
      }
    }
  }

  handleBufferTimeseriesTimeChange(event: any) {
    this.timeSeriesData.bufferTime = event.bufferTime;
    const indexInBuffer = this.bufferTimeseriesSaveList.findIndex(b => b.id === event.id);
    if (indexInBuffer !== -1) {
      this.bufferTimeseriesSaveList[indexInBuffer] = event;
    } else {
      this.bufferTimeseriesSaveList.push(event);
    }
  }

  handleSaveXmlClick() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save contents change?'
    };
    this.dialogService.confirm(param).subscribe(result => {
      if (result) {
        this.spinnerService.show();
        if (this.bufferXmlSaveList.length) {
          this.dashboardService
            .saveXMLData(this.xmlData.id, this.xmlData.bufferTime)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
              if (res instanceof HttpErrorResponse) {
                this.spinnerService.hide();
                this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
              } else {
                this.spinnerService.hide();
                this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
              }
            });
        }
      }
    });
  }

  handleSaveTimeseriesClick() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save contents change?'
    };
    this.dialogService.confirm(param).subscribe(result => {
      if (result) {
        this.spinnerService.show();
        if (this.bufferTimeseriesSaveList.length) {
          this.dashboardService
            .saveTimeseriesData(this.timeSeriesData.id, this.timeSeriesData.bufferTime)
            .pipe(catchError(err => of(err)))
            .subscribe(res => {
              if (res instanceof HttpErrorResponse) {
                this.spinnerService.hide();
                this.toast.error(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_FAILED);
              } else {
                this.spinnerService.hide();
                this.toast.success(messageConstant.DASHBOARD_CUTTING_VIDEO.SAVE_SUCCESS);
                this.bufferTimeseriesSaveList = [];
              }
            });
        }
      }
    });
  }

  onEditing() {
    this.isCutting = true;
  }
}
