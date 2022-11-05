export class RoleVideoManagementModel {
  admin: boolean;
  standard: boolean;
  uploader: boolean;
  pro: boolean;
  dataDL: boolean;

  constructor() {
    this.admin = false;
    this.standard = false;
    this.uploader = false;
    this.pro = false;
    this.dataDL = false;
  }
}
