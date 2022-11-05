export class ProjectModel {
  id: number;
  name: string;
  thumbnail: string;
  description: string;
}

export class VideoModel {
  id: number;
  title: string;
  isComment: boolean;
  additionalDate: string;
  thumbnail: string;
  privileges: string[];
  key: string;
  bucket: string;
  videoData: VideoDataModel[];
  xmlData: XMLModel[];
  timeSeriesData: CSVModel[];
}
export class VideoDataModel {
  id: number;
  title: string;
  url: string;
  owner: string;
  thumbnail: string;
  additionalDate: string;
  bucket: string;
  isAlias: boolean;
}
export class FolderModel {
  id: number;
  name: string;
  currentPage = 1;
  videoData: VideoModel[] = [];
  showMore = true;
  totalElementsFolder: number;
  privileges: string[];
}

// export class FolderTableModel {
//   name: string;
//   folder: FolderModel;
//   thumbnail: string;
//   owner: string;
//   additional_date: string;
//   deleted_flag: string;
//   video_detail: VideoModel[];
// }

export class XMLModel {
  id: number;
  title: string;
  url: string;
  owner: string;
  additionalDate: string;
  bucket: string;
  isAlias: boolean;
}

export class CSVModel {
  id: number;
  title: string;
  url: string;
  owner: string;
  additionalDate: string;
  bucket: string;
  isAlias: boolean;
}

export class DocumentModel {
  id: number;
  name: string;
}

export class ApiFolderModel {
  isPrivileges: boolean;
  content: FolderModel[];
  totalElements: number;
  totalPages: number;
  size: number;
}

export class VideoSetInsideCopyResponse{
  idVideoSet: number;
  folderId: number;
  nameVideoSet: string;
  videos: any[];
  xmls: any[];
  timeSeries: any[];

  constructor() {
    this.idVideoSet = 0;
    this.folderId = 0;
    this.nameVideoSet = name;
    this.videos = [];
    this.xmls = [];
    this.timeSeries = [];
  }

}

export class VideoSetCopyResponse{
  id: number;
  folderId: number;
  title: string;
  videoData: VideoDataModel[];
  xmlData: XMLModel[];
  timeSeriesData: XMLModel[];
  videos: string[];
  xmls: string[];
  time_series: string[];

  constructor() {
    this.id = 0;
    this.folderId = 0;
    this.title = "";
    this.videoData = [];
    this.xmlData = [];
    this.timeSeriesData = [];
    this.videos = [];
    this.xmls = [];
    this.time_series = [];
  }

}



