export class FileModel {
  id: number;
  source: File;
  uploadDate: Date | string;
  thumbnail: string;
  blobFile: Blob;
  aws: AWSModel;
  thumbnailAws: AWSModel;
  isUploaded: boolean;
  owner: string;
  name: string;
  isActive: boolean;
  duration: number;
  isAlias: boolean;
}

export class AWSModel {
  Location: string;
  ETag: string;
  Bucket: string;
  Key: string;
  constructor(location: string, key?: string) {
    this.Location = location ? location : '';
    if (key) {
      this.Key = key;
    }
  }
}

export const CONFIRM_ITEM_TYPE = {
  VIDEO: 'Video',
  XML: 'XML',
  CSV: 'Time Series'
};

export const CONFIRM_ITEM_ACTION = {
  DELETE: 'DELETE',
  ADD_NEW: 'ADD_NEW'
};

export class ObjectConfirmUpdateModel {
  id: string | number;
  dataName: string;
  type: string;
  action: string;
  aliasBeDeleted: any[];

  constructor(data: any) {
    this.id = data.id || '';
    this.dataName = data.name;
    this.type = data.type;
    this.action = data.action;
    this.aliasBeDeleted = data.aliasBeDeleted;
  }
}
