import { DateUtil } from '@app/shared/utils/date';
import { environment } from '@environments/environment';
export class UserModel {
  id: number;
  fullName: string;
  description: string;
  group: any[];
  groupName: string;
  email: string;
  isDelete = false;
  role: number;
  roleValue: string;

  constructor(data: any) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.description = data.description;
    this.group = data.group;
    this.groupName = data.group ? data.group.map(g => g.name).join(',') : '';
    this.email = data.email;
    this.role = data.role;
    this.roleValue = data.role === 1 ? 'User' : 'Admin';
  }
}
export class UserGroupModel {
  id: number;
  name: string;
  description: string;
  isDelete = false;
  users: UserModel[];
  member: string;
}
export class UserAvailableModel {
  id: number;
  fullName: string;
  selected: boolean;
}

export class SysProjectModel {
  private dateUtil: DateUtil = new DateUtil();
  comment: string;
  createDate: string;
  creater: string;
  deletedFlag: boolean;
  id: number;
  name: string;
  bucket: string;
  thumbnail: string;
  constructor(element: any) {
    this.id = element.id;
    this.name = element.name;
    this.bucket = element.bucket;
    this.creater = element.creater;
    this.comment = element.description;
    this.thumbnail = element.thumbnail;
    this.createDate = element.createDate && this.convertDate(element.createDate);
    this.deletedFlag = element.deleted_flag;
  }

  convertDate(stringDate: string) {
    const dateConvert = this.dateUtil.convertTimeZone(stringDate, environment.timeZone);
    const mm = dateConvert.getMonth() + 1 > 9 ? dateConvert.getMonth() + 1 : `0${dateConvert.getMonth() + 1}`;
    const dd = dateConvert.getDate() > 9 ? dateConvert.getDate() : `0${dateConvert.getDate()}`;
    const stringResult = `${dateConvert.getFullYear()}-${mm}-${dd}`;
    return stringResult;
  }
}
export class UserGroupAvailableModel {
  id: number;
  name: string;
}
