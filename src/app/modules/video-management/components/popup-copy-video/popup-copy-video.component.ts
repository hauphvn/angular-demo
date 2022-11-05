import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  userPrivileges,
  COPY_PATTERN,
  COPY_VIDEO_TYPE,
  copyPatternOptions,
  copyVideoOptions,
  messageConstant
} from '@app/configs/app-constants';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import {
  FolderModel,
  VideoDataModel,
  VideoSetInsideCopyResponse,
  XMLModel
} from '@app/shared/models/videoManagementModel';
import { VideoSetCopyResponse } from '@app/shared/models/videoManagementModel';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { CopyVideoRequest } from '@app/shared/models/requests/copyVideoRequest';
import { ToastrService } from 'ngx-toastr';
import { UserRoleService } from '@app/core/services/component-services/userRole.service';
import { DateUtil } from '@app/shared/utils/date';

@Component({
  selector: 'app-popup-copy-video',
  templateUrl: './popup-copy-video.component.html',
  styleUrls: ['./popup-copy-video.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PopupCopyVideoComponent implements OnInit {
  userRole: any[];
  listFolder: any[] = [];
  listSourceFolder: any[] = [];
  listTargetFolder: any[] = [];
  projectId = 0;
  header: string;
  selectedCopyPattern = -1;
  selectedCopyVideoType = 0;
  selectedFolderSource: FolderModel;
  selectedFolderDestination: FolderModel;
  copyPatternOptions: any = copyPatternOptions;
  copyVideoOptions: any = copyVideoOptions;
  validated = false;
  isChoseAllTime = false;
  isChoseAllVideoDetail = false;
  isChoseAllXML = false;
  listVideoSetByFolderSource: VideoSetInsideCopyResponse[] = [];
  listVideoSetByFolderSourceOnly: any[] = [];
  listVideoSetByFolderTargetOnly: any[] = [];
  listVideoSetInsideProjectId: VideoSetInsideCopyResponse[] = [];
  listVideoSetByFolderTarget: VideoSetInsideCopyResponse[] = [];
  listVideoDetailChoseByVideoSet: VideoDataModel[] = [];
  listXMLChoseByVideoSet: XMLModel[] = [];
  listMeasureChoseByVideoSet: XMLModel[] = [];
  copyPatterUserChose: number;
  selectedOptionSourceFolder = -1;
  selectedOptionVideoSetSource = -1;
  selectedOptionVideoSetTarget = -1;
  selectedOptionTargetFolder = -1;
  userPrivileges = userPrivileges;
  isChoseVideoSetPattern = false;
  isChoseAllFolderPattern = false;
  isChoseIndividualVideoPattern = false;
  listVideoDetailIdOfVideoSet: any[];
  listXMLDetailIdOfVideoSet: any[];
  listTimeSerDetailIdOfVideoSet: any[];
  listSpecVideoDetailIdOfVideoSet: any[];
  listSpecXMLDetailIdOfVideoSet: any[];
  listSpecTimeSerDetailIdOfVideoSet: any[];
  listVideoDetailChosen: number[] = [];
  listXMLChosen: number[] = [];
  listTimeSeriesChosen: number[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dateUtil: DateUtil,
    private userRoleService: UserRoleService,
    private dialog: DialogService,
    private spinner: SpinnerService,
    public dialogRef: MatDialogRef<PopupCopyVideoComponent>,
    private videoManagementService: VideoManagementService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.header = 'COPY VIDEO';
    this.copyPatternOptions[0].checked = true;
    this.selectedCopyPattern = this.copyPatternOptions[0].key;
    this.selectedCopyVideoType = this.copyVideoOptions[0].key;
    this.selectedFolderSource = undefined;
    this.selectedFolderDestination = undefined;
    this.chooseCopyPattern(this.copyPatternOptions[0]);
    const { projectId } = this.data;
    this.projectId = projectId;
    this.getListFolderOnly();
    this.listVideoSetByFolderSource = [];
    this.listVideoSetByFolderTarget = [];
    this.resetCheckBox();
    this.listVideoDetailIdOfVideoSet = [];
    this.listXMLDetailIdOfVideoSet = [];
    this.listTimeSerDetailIdOfVideoSet = [];
  }

  closeModal() {
    this.dialogRef.close();
  }

  resetCheckBox() {
    this.isChoseAllTime = false;
    this.isChoseAllVideoDetail = false;
    this.isChoseAllXML = false;
    this.listVideoDetailChoseByVideoSet = [];
    this.listXMLChoseByVideoSet = [];
    this.listMeasureChoseByVideoSet = [];
  }

  private setUserChoseCopyPattern(): void {
    for (const i of this.copyPatternOptions) {
      if (i.checked) {
        this.copyPatterUserChose = i.key;
        return;
      }
    }
    this.copyPatterUserChose = -1;
  }

  chooseCopyPattern(item: any): void {
    this.selectedCopyPattern = +item.key;
    this.selectedOptionSourceFolder = -1;
    this.selectedOptionTargetFolder = -1;
    this.selectedOptionVideoSetSource = -1;
    this.selectedOptionVideoSetTarget = -1;
    if (+item.key === COPY_PATTERN.ALL_FOLDER) {
      this.isChoseAllFolderPattern = true;
      this.isChoseIndividualVideoPattern = false;
      this.isChoseVideoSetPattern = false;
    } else if (+item.key === COPY_PATTERN.VIDEO_SET) {
      this.isChoseVideoSetPattern = true;
      this.isChoseAllFolderPattern = false;
      this.isChoseIndividualVideoPattern = false;
    } else if (+item.key === COPY_PATTERN.INDIVIDUAL_VIDEO) {
      this.isChoseVideoSetPattern = true;
      this.isChoseAllFolderPattern = false;
      this.isChoseIndividualVideoPattern = true;
      this.listSpecTimeSerDetailIdOfVideoSet = [];
      this.listSpecVideoDetailIdOfVideoSet = [];
      this.listSpecXMLDetailIdOfVideoSet = [];
      this.isChoseAllTime = false;
      this.isChoseAllVideoDetail = false;
      this.isChoseAllXML = false;
    }
    this.resetSelectedCopyPattern(item);
    this.setUserChoseCopyPattern();
    this.validateAll();
  }

  chooseCopyVideoType(item: any): void {
    this.selectedCopyVideoType = item.key;
  }

  /**
   * At the time only copy pattern is selected
   * @param id: key of item in copyPatternOptions
   */
  private resetSelectedCopyPattern(item: any): void {
    if (item.checked) {
      for (const i of this.copyPatternOptions) {
        i.key === item.key ? (i.checked = true) : (i.checked = false);
      }
    } else {
      for (const i of this.copyPatternOptions) {
        i.key !== item.key ? (i.checked = false) : (i.checked = true);
      }
    }
  }

  /**
   * Showing layout to fit with copying option
   * @param key: key of item in copyPatternOptions
   */
  private getVideoSetByFolderTarget(folderId: number) {
    this.listVideoSetByFolderTargetOnly = [];
    this.videoManagementService.getListVideosInsideCopy(folderId).subscribe(
      res => {
        this.listVideoSetByFolderTargetOnly = res;
      },
      error => {
        this.spinner.hide();
      }
    );
  }

  validateAll() {
    if (this.selectedCopyVideoType > 0) {
      switch (+this.selectedCopyPattern) {
        case COPY_PATTERN.ALL_FOLDER: {
          if (+this.selectedOptionSourceFolder > 0 && +this.selectedOptionTargetFolder > 0) {
            this.validated = true;
          } else {
            this.validated = false;
          }
          break;
        }
        case COPY_PATTERN.VIDEO_SET: {
          if (
            +this.selectedOptionSourceFolder > 0 &&
            +this.selectedOptionTargetFolder > 0 &&
            +this.selectedOptionVideoSetSource > 0
          ) {
            this.validated = true;
          } else {
            this.validated = false;
          }
          break;
        }
        case COPY_PATTERN.INDIVIDUAL_VIDEO: {
          if (
            this.selectedOptionSourceFolder > 0 &&
            this.selectedOptionTargetFolder > 0 &&
            this.selectedOptionVideoSetSource > 0 &&
            this.selectedOptionVideoSetTarget > 0 &&
            (this.listVideoDetailChosen.length > 0 ||
              this.listXMLChosen.length > 0 ||
              this.listTimeSeriesChosen.length > 0)
          ) {
            this.validated = true;
          } else {
            this.validated = false;
          }
          break;
        }
        default: {
          this.validated = false;
          break;
        }
      }
    } else {
      this.validated = false;
    }
  }

  choseVideoSetTarget(event: any): void {
    this.validateAll();
  }

  choseVideoSetSource(event?: any) {
    if (this.isChoseIndividualVideoPattern) {
      if (this.selectedOptionVideoSetSource > 0) {
        this.listVideoDetailIdOfVideoSet = [];
        this.listXMLDetailIdOfVideoSet = [];
        this.listTimeSerDetailIdOfVideoSet = [];
        this.listSpecVideoDetailIdOfVideoSet = [];
        this.listSpecXMLDetailIdOfVideoSet = [];
        this.listSpecTimeSerDetailIdOfVideoSet = [];

        this.videoManagementService.getListIndividualVideosInsideCopy(this.selectedOptionVideoSetSource).subscribe(
          resVideos => {
            if (resVideos.videos.length > 0) {
              resVideos.videos.forEach(vd => {
                const objVideo = {
                  id: vd.id,
                  title: vd.name,
                  setVideoId: this.selectedOptionVideoSetSource,
                  checked: false
                };
                this.listVideoDetailIdOfVideoSet.push(objVideo);
              });
            }
            if (resVideos.xmls.length > 0) {
              resVideos.xmls.forEach(myXML => {
                const objXML = {
                  id: myXML.id,
                  title: myXML.name,
                  setVideoId: this.selectedOptionVideoSetSource,
                  checked: false
                };
                this.listXMLDetailIdOfVideoSet.push(objXML);
              });
            }
            if (resVideos.time_series.length > 0) {
              resVideos.time_series.forEach(timesSer => {
                const objXML = {
                  id: timesSer.id,
                  title: timesSer.name,
                  setVideoId: this.selectedOptionVideoSetSource,
                  checked: false
                };
                this.listTimeSerDetailIdOfVideoSet.push(objXML);
              });
            }
            for (const video of this.listVideoDetailIdOfVideoSet) {
              if (+video.setVideoId === +this.selectedOptionVideoSetSource) {
                video.checked = false;
                this.listSpecVideoDetailIdOfVideoSet.push(video);
              }
            }
            for (const xml of this.listXMLDetailIdOfVideoSet) {
              if (+xml.setVideoId === +this.selectedOptionVideoSetSource) {
                xml.checked = false;
                this.listSpecXMLDetailIdOfVideoSet.push(xml);
              }
            }
            for (const timeSer of this.listTimeSerDetailIdOfVideoSet) {
              if (+timeSer.setVideoId === +this.selectedOptionVideoSetSource) {
                timeSer.checked = false;
                this.listSpecTimeSerDetailIdOfVideoSet.push(timeSer);
              }
            }
          },
          error => {
            this.spinner.hide();
          }
        );
      }
    }
    this.validateAll();
  }

  choseFolderSource(event: any) {
    // Source folder and Target folder are different.
    if (this.isChoseVideoSetPattern) {
      this.getVideoSetByFolderSource(this.selectedOptionSourceFolder);
      // this.choseVideoSetSource();
    }
    // this.selectedOptionVideoSetSource = -1;
    this.validateAll();
  }

  choseFolderTarget(event: any) {
    this.getVideoSetByFolderTarget(this.selectedOptionTargetFolder);
    this.selectedOptionVideoSetTarget = -1;
    this.validateAll();
  }

  choseAllVideoDetail(): void {
    this.isChoseAllVideoDetail = !this.isChoseAllVideoDetail;
    for (const video of this.listSpecVideoDetailIdOfVideoSet) {
      video.checked = this.isChoseAllVideoDetail;
    }
    if (this.isChoseAllVideoDetail) {
      this.listVideoDetailChosen = [];
      for (const video of this.listSpecVideoDetailIdOfVideoSet) {
        this.listVideoDetailChosen.push(video.id);
      }
    } else {
      this.listVideoDetailChosen = [];
    }
    this.validateAll();
  }

  choseAllTimeSeries(): void {
    this.isChoseAllTime = !this.isChoseAllTime;
    for (const video of this.listSpecTimeSerDetailIdOfVideoSet) {
      video.checked = this.isChoseAllTime;
    }
    if (this.isChoseAllTime) {
      this.listTimeSeriesChosen = [];
      for (const video of this.listSpecTimeSerDetailIdOfVideoSet) {
        this.listTimeSeriesChosen.push(video.id);
      }
    } else {
      this.listTimeSeriesChosen = [];
    }
    this.validateAll();
  }

  choseAllXMLDetail(): void {
    this.isChoseAllXML = !this.isChoseAllXML;
    for (const xml of this.listSpecXMLDetailIdOfVideoSet) {
      xml.checked = this.isChoseAllXML;
    }
    if (this.isChoseAllXML) {
      this.listXMLChosen = [];
      for (const xml of this.listSpecXMLDetailIdOfVideoSet) {
        this.listXMLChosen.push(xml.id);
      }
    } else {
      this.listXMLChosen = [];
    }
    this.validateAll();
  }

  handleSaveClick(): void {
    const copyVideoRequest: CopyVideoRequest = new CopyVideoRequest();
    copyVideoRequest.isPhysicCopy = this.selectedCopyVideoType === COPY_VIDEO_TYPE.PHYSIC ? true : false;
    copyVideoRequest.copyPattern = this.copyPatterUserChose;
    copyVideoRequest.sourceFolderId = this.selectedOptionSourceFolder;
    copyVideoRequest.targetFolderId = this.selectedOptionTargetFolder;
    copyVideoRequest.sourceVideoDetailIds.push(+this.selectedOptionVideoSetSource);
    copyVideoRequest.targetVideoDetailId = this.selectedOptionVideoSetTarget;
    copyVideoRequest.sourceVideoDataIds = this.listVideoDetailChosen;
    copyVideoRequest.sourceXMLDataIds = this.listXMLChosen;
    copyVideoRequest.sourceTimeSeriesDataIds = this.listTimeSeriesChosen;
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save changes?'
    };
    this.dialog.confirm(param).subscribe(isOK => {
      if (isOK) {
        this.spinner.show();
        this.videoManagementService.saveChangeCopyAllFolder(copyVideoRequest).subscribe(data => {
          this.spinner.hide();
          this.toastr.success(messageConstant.COPY_VIDEO.SUCCESS);
          this.dialogRef.close(true);
          this.getListFolderInsideCopy();
        }, this.catchError.bind(this));
      }
    }, this.catchError.bind(this));
  }

  catchError(err) {
    this.spinner.hide();
    if (err.status === 400) {
      this.toastr.error(messageConstant.COPY_VIDEO.COMMON_ERROR);
    } else {
      this.toastr.error(err.message || err);
    }
  }

  chosenVideoDetail(id: number) {
    if (this.listVideoDetailChosen.length === this.listSpecVideoDetailIdOfVideoSet.length) {
      this.isChoseAllVideoDetail = false;
    }
    for (const video of this.listSpecVideoDetailIdOfVideoSet) {
      if (video.id === +id) {
        if (video.checked) {
          let index = -1;
          for (const idVideo of this.listVideoDetailChosen) {
            ++index;
            if (idVideo === +id) {
              break;
            }
          }
          this.listVideoDetailChosen.splice(index, 1);
          video.checked = false;
          break;
        } else {
          this.listVideoDetailChosen.push(+id);
          video.checked = true;
          if (this.listVideoDetailChosen.length === this.listSpecVideoDetailIdOfVideoSet.length) {
            this.isChoseAllVideoDetail = true;
          }
        }
      }
    }
    this.validateAll();
  }

  chosenXML(id: number) {
    if (this.listXMLChosen.length === this.listSpecXMLDetailIdOfVideoSet.length) {
      this.isChoseAllXML = false;
    }
    for (const xml of this.listSpecXMLDetailIdOfVideoSet) {
      if (xml.id === +id) {
        if (xml.checked) {
          let index = -1;
          for (const idXML of this.listXMLChosen) {
            ++index;
            if (idXML === +id) {
              break;
            }
          }
          this.listXMLChosen.splice(index, 1);
          xml.checked = false;
          break;
        } else {
          this.listXMLChosen.push(+id);
          xml.checked = true;
          if (this.listXMLChosen.length === this.listSpecXMLDetailIdOfVideoSet.length) {
            this.isChoseAllXML = true;
          }
        }
      }
    }
    this.validateAll();
  }

  chosenTimeSeries(id: number) {
    if (this.listTimeSeriesChosen.length === this.listSpecTimeSerDetailIdOfVideoSet.length) {
      this.isChoseAllTime = false;
    }
    for (const time of this.listSpecTimeSerDetailIdOfVideoSet) {
      if (time.id === +id) {
        if (time.checked) {
          let index = -1;
          for (const idTime of this.listTimeSeriesChosen) {
            ++index;
            if (idTime === +id) {
              break;
            }
          }
          this.listTimeSeriesChosen.splice(index, 1);
          time.checked = false;
          break;
        } else {
          this.listTimeSeriesChosen.push(+id);
          time.checked = true;
          if (this.listTimeSeriesChosen.length === this.listSpecTimeSerDetailIdOfVideoSet.length) {
            this.isChoseAllTime = true;
          }
        }
      }
    }
    this.validateAll();
  }

  private getListFolderOnly() {
    this.videoManagementService.getListFolderInsideCopy(this.projectId).subscribe(
      result => {
        this.listFolder = result;
      },
      () => this.spinner.hide()
    );
  }

  private getListFolderInsideCopy() {
    this.listVideoSetInsideProjectId = [];
    this.videoManagementService.getListFolderInsideCopy(this.projectId).subscribe(
      result => {
        this.listFolder = result;
        this.listSourceFolder = this.listFolder;
        this.listTargetFolder = this.listFolder;
        for (let folderId of result) {
          this.videoManagementService.getListVideosInsideCopy(folderId.id).subscribe(
            videoSetList => {
              for (let videoSetId of videoSetList) {
                this.videoManagementService.getListIndividualVideosInsideCopy(videoSetId.id).subscribe(
                  videoDetailList => {
                    let videoDetailInside = new VideoSetInsideCopyResponse();
                    videoDetailInside.folderId = folderId.id;
                    videoDetailInside.idVideoSet = videoSetId.id;
                    videoDetailInside.nameVideoSet = videoSetId.name;
                    videoDetailInside.videos = videoDetailList.videos;
                    videoDetailInside.xmls = videoDetailList.xmls;
                    videoDetailInside.timeSeries = videoDetailList.time_series;
                    this.listVideoSetInsideProjectId.push(videoDetailInside);
                  },
                  error => {
                    this.spinner.hide();
                  }
                );
              }
            },
            error => {
              this.spinner.hide();
            }
          );
        }
      },
      error => {
        this.spinner.hide();
      }
    );
  }

  private getVideoSetByFolderSource(folderId: number) {
    this.videoManagementService.getListVideosInsideCopy(folderId).subscribe(
      res => {
        this.listVideoSetByFolderSourceOnly = res;
      },
      error => {
        this.spinner.hide();
      }
    );
  }
}
