import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { MatDialog } from '@angular/material';
import { PopupEditCommentComponent } from '../popup-edit-comment/popup-edit-comment.component';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { messageConstant } from '@app/configs/app-constants';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { PopupEditReplyComponent } from '../popup-edit-reply/popup-edit-reply.component';
import jwt_decode from "jwt-decode";
import { DateUtil } from '@app/shared/utils/date';
import { HostListener } from "@angular/core";

@Component({
  selector: 'app-dashboard-comment-item',
  templateUrl: './dashboard-comment-item.component.html',
  styleUrls: ['./dashboard-comment-item.component.scss']
})
export class DashboardCommentItemComponent implements OnInit {
  @Input() commentItem;
  @Output() replyEvent = new EventEmitter<any>();
  replyForm: FormGroup;
  maxTimeCommentEdit: number;
  userId: string;
  cloneCommentItem;
  zoomPercent = 100;
  PCZoomLevel= 100;
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.zoomPercent = Math.round((window.outerWidth / window.innerWidth) * 100);
    this.PCZoomLevel = Math.round(window.devicePixelRatio * 100);
  }
  constructor(
    private authService: AuthenticationService,
    private headerService: HeaderService,
    private dialogService: DialogService,
    private dashboardService: DashboardService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private videoChartService: VideoChartService,
    private dialog: MatDialog,
    private dateUtil: DateUtil,
  ) { }
  showComment: boolean;

  ngOnInit() {
    this.videoChartService.duration.subscribe(maxDuration => (this.maxTimeCommentEdit = maxDuration));
    this.showComment = false;
    const { access_token } = JSON.parse(localStorage.getItem('currentUser'));
    const { user_id } = jwt_decode(access_token) as any;
    this.userId = user_id;
    this.innitForm();
    this.getScreenSize();
  }

  innitForm() {
    // Init form object and validate
    this.replyForm = new FormGroup({
      reply: new FormControl('', [])
    });
  }

  get replyData() {
    return this.replyForm.controls;
  }

  toggleActive(event, elementRoot) {
    this.showComment = !this.showComment;
    elementRoot.classList.toggle('active');
  }

  addReply(elementRoot) {
    if (this.replyData.reply.value.length) {
      // Reply is input
      const replyItem = {
        userId: this.userId,
        message: this.replyData.reply.value,
        timeComment: new Date()
      };
      this.replyEvent.emit({ commentId: this.commentItem.id, replies: replyItem });
      this.replyData.reply.setValue('');
      this.showComment = true;
      elementRoot.classList.add('active');
    }
  }

  deleteComment() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to delete this comment?'
    };
    this.dialogService.confirm(param).subscribe(res => {
      if (res) {
        this.spinner.show();
        this.dashboardService.deleteComment(this.commentItem.id).subscribe(
          response => {
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.DELETE_SUCCESS);
          },
          error => {
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.DELETE_FAIL);
          }
        );
      }
    });
  }

  editComment() {
    const dialogRef = this.dialog.open(PopupEditCommentComponent, {
      width: '35%',
      minWidth: '600px',
      disableClose: true,
      data: Object.assign({}, this.commentItem, { maxDuration: Math.floor(this.maxTimeCommentEdit) })
    });
  }

  editReply(replyItem) {
    const replyData = { ...replyItem, sceneName: this.commentItem.sceneName, commentItem: this.commentItem };
    const dialogRef = this.dialog.open(PopupEditReplyComponent, {
      width: '35%',
      minWidth: '600px',
      disableClose: true,
      data: Object.assign({}, replyData, { maxDuration: Math.floor(this.maxTimeCommentEdit) })
    });
  }

  deleteReply(replyItem) {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to delete this comment?'
    };
    let replyData = { id: replyItem.id };
    this.dialogService.confirm(param).subscribe(res => {
      if (res) {
        this.spinner.show();
        this.dashboardService.deleteReply(this.commentItem.id, JSON.stringify(replyData)).subscribe(
          response => {
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.DELETE_SUCCESS);
          },
          error => {
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.DELETE_FAIL);
          }
        );
      }
    });
  }

  cancelReply() {
    this.replyData.reply.setValue('');
  }
}
