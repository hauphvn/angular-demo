import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { VideoManagementService } from '@app/core/services/server-services/video-management.service';
import { CONFIRM_ITEM_ACTION, CONFIRM_ITEM_TYPE, ObjectConfirmUpdateModel } from '@app/shared/models/fileModel';

@Component({
  selector: 'app-update-confirm-dialog',
  templateUrl: './update-confirm-dialog.component.html',
  styleUrls: ['./update-confirm-dialog.component.scss']
})
export class UpdateConfirmDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<UpdateConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ObjectConfirmUpdateModel[],
    private spinnerService: SpinnerService,
    private videoManagermentService: VideoManagementService
  ) { }

  ngOnInit() {
    this.spinnerService.show();
    const dataGetAlias = {
      deleted_videoData_ids: this.data
        .filter(d => d.type === CONFIRM_ITEM_TYPE.VIDEO && d.action === CONFIRM_ITEM_ACTION.DELETE)
        .map(v => +v.id),
      deleted_timeSeriesData_ids: this.data
        .filter(d => d.type === CONFIRM_ITEM_TYPE.CSV && d.action === CONFIRM_ITEM_ACTION.DELETE)
        .map(csv => +csv.id)
    };
    this.videoManagermentService.getAliasData(dataGetAlias).subscribe(
      (res: any) => {
        this.data.map((item) => {
          switch (item.type) {
            case CONFIRM_ITEM_TYPE.VIDEO:
              item.aliasBeDeleted = !!res.videos_data.find(el => el.delete_id === item.id)
                && !!res.videos_data.find(el => el.delete_id === item.id).data
                ? res.videos_data.find(el => el.delete_id === item.id).data
                : [];
              return item;
            case CONFIRM_ITEM_TYPE.CSV:
              item.aliasBeDeleted = !!res.time_series_data.find(el => el.delete_id === item.id)
                && !!res.time_series_data.find(el => el.delete_id === item.id).data
                ? res.time_series_data.find(el => el.delete_id === item.id).data
                : [];
              return item;
            default:
              break;
          }
        });
        this.spinnerService.hide();
      },
      () => {
        this.spinnerService.hide();
      }
    );
  }

  closeModal() {
    this.dialogRef.close(false);
  }

  handleSaveClick() {
    //
    this.dialogRef.close(true);
  }
}
