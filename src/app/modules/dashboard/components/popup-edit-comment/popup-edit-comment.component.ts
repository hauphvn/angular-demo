import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { messageConstant } from '@app/configs/app-constants';
import { DateUtil } from '@app/shared/utils/date';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';

@Component({
  selector: 'app-popup-edit-comment',
  templateUrl: './popup-edit-comment.component.html',
  styleUrls: ['./popup-edit-comment.component.scss']
})
export class PopupEditCommentComponent implements OnInit {
  commentForm: FormGroup;
  timeFormatOption: any;
  constructor(
    public dialogRef: MatDialogRef<PopupEditCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public commentData: any,
    private dashboardService: DashboardService,
    private toastr: ToastrService,
    private spinner: SpinnerService,
    private dateUtil: DateUtil,
    private dialog: DialogService
  ) { }

  ngOnInit() {
    this.timeFormatOption = {
      mask: [/[0-5]/, /[0-9]/, ':', /[0-5]/, /[0-9]/, '.', /[0-9]/, /[0-9]/],
      guide: true,
      showMask: true,
      keepCharPositions: true
    };
    this.initForm();
  }

  initForm() {
    const stringTimeInFullFormat = this.dateUtil.secondsToTime(
      this.dateUtil.stringTimeToSeconds(this.commentData.timeInVideo)
    );
    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(:|\.)\d{1,2}?$/;
    if (timeRegex.test(this.commentData.timeInVideo)) {
      this.timeFormatOption.mask = [/[0-2]/, /[0-3]/, ':', /[0-5]/, /[0-9]/, ':', /[0-5]/, /[0-9]/, '.', /[0-9]/, /[0-9]/];
    }
    this.commentForm = new FormGroup({
      time: new FormControl(stringTimeInFullFormat, [
        CustomValidator.validateTimeString(this.dateUtil.secondsToTime(this.commentData.maxDuration)),
        CustomValidator.required
      ]),
      comment: new FormControl(this.commentData.message, [CustomValidator.maxLength(200), CustomValidator.required]),
      sceneName: new FormControl({value: this.commentData.sceneName, disabled: true}, [])
    });
  }

  handleSaveEditComment() {
    if (this.commentForm.valid) {
      const { time, comment } = this.commentForm.controls;
      this.spinner.show();
      const dataCommentUpdate = {
        commentId: this.commentData.id,
        message: comment.value,
        timeInVideo: this.dateUtil.stringTimeToSeconds(time.value)
      };
      this.dashboardService.updateComment(dataCommentUpdate).subscribe(
        res => {
          this.spinner.hide();
          this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.UPDATE_SUCCESS);
          this.dialogRef.close();
        },
        error => {
          this.spinner.hide();
          this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.UPDATE_FAIL);
        }
      );
    }
  }

  get disableSaveButton() {
    const { time, comment } = this.commentForm.controls;
    return (time.pristine && comment.pristine) || this.commentForm.invalid;
  }
}
