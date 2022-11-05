import { apiPathConstant, COPY_PATTERN } from './../../../configs/app-constants';
import { from } from 'rxjs';
import { VideoModel, FolderModel } from '@app/shared/models/videoManagementModel';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';
import { CopyVideoRequest } from '@app/shared/models/requests/copyVideoRequest';

@Injectable({ providedIn: 'root' })
export class VideoManagementService {
  constructor(private http: HttpClient) { }

  getListFolderInProject(projectId: number, sortType: number) {
    let params = new HttpParams();
    params = params.set('projectId', projectId.toString()).set('order', sortType.toString());
    return this.http.get<FolderModel[]>(`${environment.apiUrl}/management/folder`, { params });
  }

  getListFolderInsideCopy(projectId: number) {
    let params = new HttpParams();
    params = params
      .set('projectId', projectId.toString());
    return this.http.get<FolderModel[]>(`${environment.apiUrl}/${apiPathConstant.managementController.COPY_BY_FOLDER}`, { params });
  }

  getListVideosInsideCopy(folderId: number) {
    let params = new HttpParams();
    params = params
      .set('folderId', folderId.toString());
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.managementController.COPY_BY_VIDEO_SET}`, { params });
  }

  getListIndividualVideosInsideCopy(videoDetailId: number) {
    let params = new HttpParams();
    params = params
      .set('videoDetailId', videoDetailId.toString());
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.managementController.COPY_BY_INDIVIDUAL}`, { params });
  }

  saveChangeCopyAllFolder(copyVideoRequest: CopyVideoRequest) {
    let options = {};

    if (copyVideoRequest.copyPattern === COPY_PATTERN.ALL_FOLDER) {
      options = {
        is_physic_copy: copyVideoRequest.isPhysicCopy,
        copy_pattern: +copyVideoRequest.copyPattern,
        source_folder_id: +copyVideoRequest.sourceFolderId,
        target_folder_id: +copyVideoRequest.targetFolderId
      };
    } else if (copyVideoRequest.copyPattern === COPY_PATTERN.VIDEO_SET) {
      options = {
        is_physic_copy: copyVideoRequest.isPhysicCopy,
        copy_pattern: +copyVideoRequest.copyPattern,
        source_folder_id: +copyVideoRequest.sourceFolderId,
        target_folder_id: +copyVideoRequest.targetFolderId,
        source_video_detail_ids: copyVideoRequest.sourceVideoDetailIds
      };
    } else if (copyVideoRequest.copyPattern === COPY_PATTERN.INDIVIDUAL_VIDEO) {
      options = {
        is_physic_copy: copyVideoRequest.isPhysicCopy,
        copy_pattern: +copyVideoRequest.copyPattern,
        source_folder_id: +copyVideoRequest.sourceFolderId,
        source_video_data_ids: copyVideoRequest.sourceVideoDataIds,
        source_xml_data_ids: copyVideoRequest.sourceXMLDataIds,
        source_time_series_data_ids: copyVideoRequest.sourceTimeSeriesDataIds,
        target_folder_id: +copyVideoRequest.targetFolderId,
        target_video_detail_id: +copyVideoRequest.targetVideoDetailId
      };
    }
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.managementController.COPY}`, options);
  }

  getVideoDetailBucket(options) {
    return this.http.post<any>(`${environment.apiUrl}/management/videoDetail/bucket`, options);
  }

  getVideoDataBucket(options) {
    return this.http.post<any>(`${environment.apiUrl}/management/videoData/bucket`, options);
  }

  getXmlDataBucket(options) {
    return this.http.post<any>(`${environment.apiUrl}/management/xmlData/bucket`, options);
  }

  getTimeSeriesDataBucket(options) {
    return this.http.post<any>(`${environment.apiUrl}/management/timeSeriesData/bucket`, options);
  }

  saveVideoDetail(options) {
    return this.http.post<VideoModel>(`${environment.apiUrl}/management/videoDetail`, options);
  }

  getDocumentDataBucket(options) {
    return this.http.post<any>(`${environment.apiUrl}/management/documentData/bucket`, options);
  }

  getProjectByCurrentPage(currentPage: number, sortType: number) {
    let params = new HttpParams();
    params = params.set('currentPage', currentPage.toString()).set('order', sortType.toString());
    return this.http.get<any>(`${environment.apiUrl}/management/project`, { params });
  }

  getVideoDetailById(id: number) {
    let params = new HttpParams();
    params = params.set('videoDetailId', id.toString());
    return this.http.get<VideoModel>(`${environment.apiUrl}/management/videoDetailById`, { params });
  }

  getListVideoByFolder(folderId: number, currentPage: number, sortType: number) {
    let params = new HttpParams();
    params = params
      .set('folderId', folderId.toString())
      .set('currentPage', currentPage.toString())
      .set('order', sortType.toString());
    return this.http.get<any>(`${environment.apiUrl}/management/videoDetailByFolder`, { params });
  }

  getListDocumentByProject(projectId: number) {
    let params = new HttpParams();
    params = params.set('projectId', projectId.toString());
    return this.http.get<any>(`${environment.apiUrl}/management/documentData`, { params });
  }

  deleteDocumentByProject(documentId: number, projectId: number) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {
        document_id: documentId,
        project_id: projectId
      }
    };
    return this.http.delete<any>(`${environment.apiUrl}/management/documentData`, options);
  }

  deleteVideoDetailById(videoDetailId: number) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: { video_detail_id: videoDetailId }
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.managementController.VIDEO_DETAIL}`, options);
  }

  deleteVideoDataById(videoDataId: number, videoDetailId: number) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {
        video_data_id: videoDataId,
        video_detail_id: videoDetailId
      }
    };
    return this.http.delete<any>(`${environment.apiUrl}/management/videoData`, options);
  }

  saveDocumentData(options: any) {
    return this.http.post<any>(`${environment.apiUrl}/management/documentData`, options);
  }

  updateVideoDetail(options: any) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.managementController.VIDEO_DETAIL}`, options);
  }

  deleteXmlDataById(xmlDataId: number, videoDetailId: number) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: {
        video_detail_id: videoDetailId,
        xml_data_id: xmlDataId
      }
    };
    return this.http.delete<any>(`${environment.apiUrl}/management/xmlData`, options);
  }

  getAliasData(data: { deleted_videoData_ids: number[]; deleted_timeSeriesData_ids: number[] }) {
    return this.http.put(`${environment.apiUrl}/management/aliasData`, data);
  }

  getListFolderExport(projectId: number) {
    let params = new HttpParams();
    params = params.set('project-id', projectId.toString());
    return this.http.get<FolderModel[]>(`${environment.apiUrl}/${apiPathConstant.managementController.EXPORT_RAW_DATA_BY_FOLDER}`, { params });
  }

  getListVideoSetExport(folderId: number) {
    let params = new HttpParams();
    params = params.set('folder-id', folderId.toString());
    return this.http.get<FolderModel[]>(`${environment.apiUrl}/${apiPathConstant.managementController.EXPORT_RAW_DATA_BY_VIDEO_SET}`, { params });
  }

  exportData(data) {
    return this.http.put(`${environment.apiUrl}/${apiPathConstant.managementController.EXPORT_RAW_DATA}`, data);
  }

  getRawDataChannelName() {
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.managementController.EXPORT_RAW_DATA_PUSHER_CHANNEL}`);
  }

  downloadDocument(projectId: number, documentId: number) {
    return this.http.put<any>(`${environment.apiUrl}/management/documentData/download`, {
      project_id: projectId,
      document_id: documentId
    });
  }

  downloadXML(videoSetId: number, xmlId: number) {
    return this.http.put<any>(`${environment.apiUrl}/management/xmlData/download`, {
      video_set_id: videoSetId,
      xml_id: xmlId
    });
  }

  downloadVideo(videoSetId: number, videoId: number) {
    return this.http.put<any>(`${environment.apiUrl}/management/videoData/download`, {
      video_set_id: videoSetId,
      video_id: videoId
    });
  }

  downloadTimesSeries(videoSetId: number, timesSeriesId: number) {
    return this.http.put<any>(`${environment.apiUrl}/management/timeSeriesData/download`, {
      video_set_id: videoSetId,
      time_series_id: timesSeriesId
    });
  }
}