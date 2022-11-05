export class CopyVideoRequest{
  isPhysicCopy: boolean;
  copyPattern: number;
  sourceFolderId: number;
  targetFolderId: number;
  sourceVideoDetailIds: number[];
  sourceVideoDataIds: number[];
  sourceXMLDataIds: number[];
  sourceTimeSeriesDataIds: number[];
  targetVideoDetailId: number;

  constructor() {
    this.isPhysicCopy = false;
    this.copyPattern = 0;
    this.sourceFolderId = 0;
    this.targetFolderId = 0;
    this.sourceVideoDataIds = [];
    this.sourceVideoDetailIds = [];
    this.sourceXMLDataIds = [];
    this.sourceTimeSeriesDataIds = [];
    this.targetVideoDetailId = 0;
  }
}
