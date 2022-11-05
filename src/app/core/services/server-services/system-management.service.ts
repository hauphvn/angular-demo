import { apiPathConstant } from './../../../configs/app-constants';
import { from, of, Observable } from 'rxjs';
import { VideoModel, FolderModel } from '@app/shared/models/videoManagementModel';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { environment } from '@environments/environment';
import {
  UserModel,
  UserGroupModel,
  UserAvailableModel,
  UserGroupAvailableModel,
  SysProjectModel
} from '@app/shared/models/systemManagementModel';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SystemManagementService {
  constructor(private http: HttpClient) {}

  getUserList(): Observable<UserModel[]> {
    const params = new HttpParams();
    return this.http
      .get<UserModel[]>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.USER}`, {
        params
      })
      .pipe(map((data: any[]) => data.map(d => new UserModel(d))));
  }
  deleteUserList(data): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    };
    return this.http.delete<any>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP}`,
      options
    );
  }
  getUserGroupList(): Observable<UserGroupModel[]> {
    const params = new HttpParams();
    return this.http.get<UserGroupModel[]>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP}`,
      { params }
    );
  }
  getUserAvaiable(): Observable<UserAvailableModel[]> {
    const params = new HttpParams();
    return this.http.get<UserAvailableModel[]>(
      `${environment.apiUrl}/${apiPathConstant.userManagementController.USERAVAIABLE}`,
      { params }
    );
  }
  insertUserGroup(data): Observable<UserGroupModel[]> {
    return this.http.post<UserGroupModel[]>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP}`,
      data
    );
  }
  updateUserGroup(data): Observable<UserGroupModel[]> {
    return this.http.put<UserGroupModel[]>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP}`,
      data
    );
  }

  getProjectList() {
    return this.http
      .get<SysProjectModel[]>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.PROJECT}`)
      .pipe(map((data: any[]) => data.map(d => new SysProjectModel(d))));
  }

  getFolderList(projectId: string) {
    const params = new HttpParams().set('projectId', projectId);
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.FOLDER}`, { params });
  }
  getUserGroupAvaiable(): Observable<UserGroupAvailableModel[]> {
    const params = new HttpParams();
    return this.http.get<UserGroupAvailableModel[]>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUPAVAIABLE}`,
      { params }
    );
  }
  insertUser(data): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.USER}`, data);
  }
  updateUser(data): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.USER}`, data);
  }

  addProject(projectInfo: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.PROJECT}`,
      projectInfo
    );
  }

  updateProject(data) {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.PROJECT}`, data);
  }

  deleteProject(data: any) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    };
    return this.http.delete<any>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.PROJECT}`,
      options
    );
  }
  updateTypeFolder(data): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.FOLDER}`, data);
  }
  deleteFolder(data): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.FOLDER}`, options);
  }

  getUserGroupAll() {
    return this.http.get<any[]>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP_ALL}`);
  }

  assignUserGroups(data: any) {
    return this.http.put<any>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.USERGROUP_ASSIGN}`,
      data
    );
  }

  deleteUser(data) {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: data
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.USER}`, options);
  }
  addFolder(option) {
    return this.http.post<any>(`${environment.apiUrl}/${apiPathConstant.systemManagementController.FOLDER}`, option);
  }

  getProjectBucket(projectName: string, isUpdate: boolean) {
    const options = { name: isUpdate ? '' : projectName };
    return this.http.post<any>(
      `${environment.apiUrl}/${apiPathConstant.systemManagementController.PROJECT_BUCKET}`,
      options
    );
  }

  getLogChannelName() {
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.logManagementController.ACTIVITY_LOGGING_PUSHER_CHANNEL}`);
  }

  getLogFileStogare() {
    return this.http.get<any>(`${environment.apiUrl}/${apiPathConstant.logManagementController.ACTIVITY_LOGGING_STOGARE}`);
  }

  exportDataLogging(data) {
    return this.http.put(`${environment.apiUrl}/${apiPathConstant.logManagementController.EXPORT_LOGGING}`, data);
  }

  removeLogging() {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: ''
    };
    return this.http.delete<any>(`${environment.apiUrl}/${apiPathConstant.logManagementController.ACTIVITY_LOGGING_STOGARE}`, options);
  }
}
