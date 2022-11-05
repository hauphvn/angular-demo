import { Router, ActivatedRoute } from '@angular/router';
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
import jwt_decode from "jwt-decode";

@Component({
  selector: 'app-popup-edit-reply',
  templateUrl: './popup-edit-reply.component.html',
  styleUrls: ['./popup-edit-reply.component.scss']
})
export class PopupEditReplyComponent implements OnInit {
  replyForm: FormGroup;
  timeFormatOption: any;
  constructor(
    public dialogRef: MatDialogRef<PopupEditReplyComponent>,
    @Inject(MAT_DIALOG_DATA) public replyData: any,
    private dashboardService: DashboardService,
    private toastr: ToastrService,
    private spinner: SpinnerService,
    private dateUtil: DateUtil,
    private dialog: DialogService,
    private router: Router,
    private route: ActivatedRoute
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
    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(:|\.)\d{1,2}?$/;
    if (timeRegex.test('stringTimeInFullFormat')) {
      this.timeFormatOption.mask = [/[0-2]/, /[0-3]/, ':', /[0-5]/, /[0-9]/, ':', /[0-5]/, /[0-9]/, '.', /[0-9]/, /[0-9]/];
    }
    this.replyForm = new FormGroup({
      reply: new FormControl(this.replyData.message, [CustomValidator.maxLength(200), CustomValidator.required]),
      time: new FormControl({value: this.dateUtil.splitDateToTime(this.replyData.timeComment), disabled: true}, []),
      sceneName: new FormControl({value: this.replyData.sceneName, disabled: true}, [])
    });
  }

  handleSaveEditComment() {
    if (this.replyForm.valid) {
      const { reply } = this.replyForm.controls;
      this.spinner.show();

      let replayIndex = this.replyData.commentItem.replies.findIndex((replay => replay.id == this.replyData.id));
      // this.replyData.commentItem.replies[replayIndex].message = reply.value;

      let replyItem = {};
      if (reply.value.length) {
        const { access_token } = JSON.parse(localStorage.getItem('currentUser'));
        const { user_id } = jwt_decode(access_token) as any;
        // Reply is input
        replyItem = {
          id: this.replyData.id,
          userId: this.replyData.userId,
          message: reply.value,
          timeComment: new Date(),
          timeRelative: this.replyData.timeRelative
        };
      }
      this.dashboardService.updateCommentUpdateReply(this.replyData.commentItem.id, JSON.stringify(replyItem)).subscribe(
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
    const { reply } = this.replyForm.controls;
    return (reply.pristine) || this.replyForm.invalid;
  }
}