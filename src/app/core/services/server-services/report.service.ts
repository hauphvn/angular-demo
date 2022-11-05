import { FolderModel } from './../../../shared/models/videoManagementModel';
import { apiPathConstant } from '../../../configs/app-constants';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { map, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { TimeSeriesDataModel } from '@app/shared/models/dashboardModel';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  getListProject() {
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.PROJECT}`);
  }

  getListFolderInProject(projectId: number) {
    let params = new HttpParams();
    params = params.set('projectId', projectId.toString());
    return this.http.get<FolderModel[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.FOLDER}`, {
      params
    });
  }

  getListVideoByFolder(folderId: number) {
    let params = new HttpParams();
    params = params.set('folderId', folderId.toString());
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.VIDEO}`, { params });
  }

  getSceneTagByVideoSet(ids: any[]) {
    let params = new HttpParams();
    params = params.set('videoDetailIds', ids.toString());
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.SCENETAG}`, {
      params
    });
  }

  getReportData(data: any) {
    const body = {
      scenes: data.scenes,
      tags: data.tags,
      video_detail_ids: data.videoSets.map(video => video.id)
    };
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.REPORTING}`, body);
  }

  getListVideoSetReport(videoDetailIds: number[]) {
    let paramString = '';
    videoDetailIds.forEach(id => {
      paramString += `videoDetailIds=${id}&`;
    });
    paramString = paramString.slice(0, -1);
    return this.http.get<any>(
      `${environment.apiUrl}/${apiPathConstant.reportManagementController.VIDEO_DETAILS}?${paramString}`
    );
  }

  getXMLData(videoID: string, accessToken?: string) {
    const param = new HttpParams().set('videoDetailId', videoID);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.XML_DATA}`, options);
  }

  getVideoData(videoDetailID, accessToken?: string) {
    const param = new HttpParams().set('videoDetailId', videoDetailID);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.VIDEO_DATA}`, options);
  }

  getListTimeSeriesData(videoDetailId: string) {
    const params = new HttpParams().set('videoDetailId', videoDetailId);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.TIMESERIES_DATA}`, {
      params
    });
  }

  getSeriesDetailData(timeSeriesId: string) {
    const params = new HttpParams().set('timeSeriesDataId', timeSeriesId);
    return this.http
      .get<any[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.TIMESERIES_META_DATA}`, { params })
      .pipe(map((d: any) => new TimeSeriesDataModel(d)));
  }

  getXMLMetaData(xmlId: string, accessToken?: string) {
    const param = new HttpParams().set('xmlDataId', xmlId);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.META_DATA}`, options).pipe(
      tap((d: any) => {
        d.data.map((task, i) => {
          task.startDate = +task.startDate;
          task.endDate = +task.endDate;
          task.select = i === 0;
          return task;
        });
        return d;
      })
    );
  }

  exportData(data) {
    return this.http.put(`${environment.apiUrl}/${apiPathConstant.reportManagementController.EXPORT_REPORTING}`, data);
  }

  private addAccessToken(param: HttpParams, accessToken?: string) {
    const options = {
      params: param
    };
    if (accessToken) {
      const header = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
      options['headers'] = header;
    }
    return options;
  }

  getReportingChannelName() {
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.EXPORT_REPORTING_PUSHER_CHANNEL}`);
  }

  getExportReportingValidate(data: any) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.reportManagementController.EXPORT_REPORTING_VALIDATE}`, data);
  }
}
