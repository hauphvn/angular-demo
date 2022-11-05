// Contains api to get user info

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';

import { map, tap } from 'rxjs/operators';
import { apiPathConstant } from '@app/configs/app-constants';
import { TimeSeriesDataModel } from '@app/shared/models/dashboardModel';
import { SceneBarParams } from '@app/shared/models/editXMLDataModel';
@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) { }

  getXMLMetaData(xmlId: string, accessToken?: string) {
    const param = new HttpParams().set('xmlDataId', xmlId);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.dashboardController.META_DATA}`, options).pipe(
      tap((d: any) => {
        if (d && d.data) {
          d.data.map((task, i) => {
            task.startDate = +task.startDate;
            task.endDate = +task.endDate;
            task.select = i === 0;
            return task;
          });
        } else {
          d.data = [];
        }
        return d;
      })
    );
  }

  getXMLData(videoID: string, accessToken?: string) {
    const param = new HttpParams().set('videoDetailId', videoID);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.dashboardController.XML_DATA}`, options);
  }

  getComments(videoDetailID, page) {
    // return of(commentList);
    const param = new HttpParams().set('videoId', videoDetailID).set('currentPage', page);
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.COMMENT}`, {
      params: param
    });
  }

  getVideoData(videoDetailID, accessToken?: string) {
    const param = new HttpParams().set('videoDetailId', videoDetailID);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.VIDEO_DATA}`, options);
  }

  saveVideoData(videoDataID: string, startTime: number) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.VIDEO_DATA}`, {
      video_data_id: videoDataID,
      startTime
    });
  }

  saveXMLData(xmlId: string, startTime: number) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.XML_DATA}`, {
      xml_data_id: xmlId,
      startTime
    });
  }

  saveTimeseriesData(timeseriesID: string, startTime: number) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.TIMESERIES_DATA}`, {
      timeseries_data_id: timeseriesID,
      startTime
    });
  }

  addComment(commentInfo) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.COMMENT}`, commentInfo);
  }

  // Update comment
  updateComment(dataCommentUpdate: any) {
    return this.http.put<any>(
      `${environment.apiUrl}/${apiPathConstant.dashboardController.COMMENT}`,
      dataCommentUpdate
    );
  }

  // Delete comment
  deleteComment(commentId: number) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: { commentId }
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.COMMENT}`, options);
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

  getListTimeSeriesData(videoDetailId: string) {
    const params = new HttpParams().set('videoDetailId', videoDetailId);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.dashboardController.TIMESERIES_DATA}`, {
      params
    });
  }

  getSeriesDetailData(timeSeriesId: string) {
    const params = new HttpParams().set('timeSeriesDataId', timeSeriesId);
    return this.http
      .get<any[]>(`${environment.apiUrl}/${apiPathConstant.dashboardController.TIMESERIES_META_DATA}`, { params })
      .pipe(map((d: any) => new TimeSeriesDataModel(d)));
  }

  // Edit video
  getVideoDataEditVideo(videoDetailID, accessToken?: string) {
    const param = new HttpParams().set('video-set-id', videoDetailID);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.VIDEO_DATA}`, options);
  }

  getXMLDataEditVideo(videoID: string, accessToken?: string) {
    const param = new HttpParams().set('video-set-id', videoID);
    const option = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_DATA}`, option);
  }

  getXmlMetaDataEditVideo(xmlId: string, accessToken?: string) {
    const param = new HttpParams().set('xml-id', xmlId);
    const option = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.META_DATA}`, option);
    // .pipe(
    //   tap((d: any) => {
    //     d.data.map((task, i) => {
    //       task.startDate = +task.startDate;
    //       task.endDate = +task.endDate;
    //       task.select = i === 0;
    //       task.barId = task.id;
    //       return task;
    //     });
    //     return d;
    //   })
    // );
  }

  validateXMLEditVideo(xmlId: number, xmlEditPattern: number) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_VALIDATE}`, {
      xml_id: xmlId,
      xml_editor_pattern: xmlEditPattern
    });
  }

  syncOriginalXML(xmlId: string) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_SYNC_ORIGINAL}`, {
      xml_id: xmlId
    });
  }

  onSaveNewSceneEditVideo(objNewScene: any) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE}`, objNewScene);
  }

  onSaveNewSceneBarEditVideo(objNewSceneBar: any) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE_BAR}`, objNewSceneBar);
  }

  onUpdateSceneBarEditVideo(objSceneBarRequest: any) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE_BAR}`, objSceneBarRequest);
  }
  onSaveSceneBarsEditVideo(objSceneBarsRequest: any) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE_BARS}`, objSceneBarsRequest);
  }

  onUpdateSceneEdit(objNewSceneRequest: any) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE}`, objNewSceneRequest);
  }

  onDeleteScene(objDelRequest: any) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: objDelRequest
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE}`, options);
  }

  onDeleteSceneBar(objDelRequest) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: objDelRequest
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE_BAR}`, options);
  }

  onSaveXMLEditVideo(objRequest: any) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_SAVE}`, objRequest);
  }

  // Add a reply
  updateCommentAddReply(commentId: string, replies: string) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.REPLY}`, {
      commentId,
      replies
    });
  }

  // Update a reply
  updateCommentUpdateReply(commentId: string, replies: string) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.REPLY}`, {
      commentId,
      replies
    });
  }

  // Delete reply
  deleteReply(commentId: string, replies: string) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: { commentId, replies }
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.dashboardController.REPLY}`, options);
  }
  // End edit video

  onCreateSceneBar4ExistingScene(params: SceneBarParams) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.SCENE_BAR}`, params);
  }

  getTagsColorsOfXML(xmlId: string, accessToken?: string) {
    const param = new HttpParams().set('xml-id', xmlId);
    const options = this.addAccessToken(param, accessToken);
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.TAGS_COLORS_Of_XML}`, options);
  }

  createNewLabel(data: any) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_DATA}`, data);
  }

  deleteXml(data: any) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.videoEditorDashboard.XML_DATA}`, options);
  }
}
