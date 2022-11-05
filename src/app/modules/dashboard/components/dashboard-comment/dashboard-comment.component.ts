import { PUSHER_EVENT } from './../../../../configs/app-constants';
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { DashboardService } from '@app/core/services/server-services/dashboard.service';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import pusher from 'pusher-js';
import { DateUtil } from '@app/shared/utils/date';
import { VideoChartCommentService } from '@app/core/services/component-services/video-chart-comment.service';
import { environment } from '@environments/environment';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { apiPathConstant } from '@app/configs/app-constants';
import { Subscription } from 'rxjs';
import jwt_decode from "jwt-decode";

@Component({
  selector: 'app-dashboard-comment',
  templateUrl: './dashboard-comment.component.html',
  styleUrls: ['./dashboard-comment.component.scss']
})
export class DashboardCommentComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() commentItem;
  @ViewChild('commentListContainer', { static: false }) private commentListContainer: ElementRef;
  @ViewChild('inputComment', { static: true }) private inputComment: ElementRef;
  constructor(
    private dashboardService: DashboardService,
    private authService: AuthenticationService,
    private dateUtil: DateUtil,
    private videoChartService: VideoChartService,
    private videoChartCommentService: VideoChartCommentService
  ) { }

  commentForm: FormGroup;
  currentPage = 1;
  pusher: pusher;
  listComment: any[];

  currentTimeVideo;
  xmlName: string;
  sceneFiltered: string;
  listSceneActived: any[];
  listCommentInVideo: any[];
  listCommentInChart: any[];
  barSelectedName: string;
  addedAComment = false;
  processAddComment = false;
  channelName: string;

  subscriptions: Subscription[] = [];
  userId: string;
  xmlId: number;

  ngOnInit() {
    // Get list comment
    // First page
    this.listCommentInVideo = [];
    this.listCommentInChart = [];
    this.barSelectedName = '';
    const { access_token } = JSON.parse(localStorage.getItem('currentUser'));
    const { user_id } = jwt_decode(access_token) as any;
    this.userId = user_id;
    this.dashboardService.getComments(this.commentItem.videoDetailId, this.currentPage).subscribe(res => {
      const pusherKey = JSON.parse(res.key);
      // Init pusher
      this.pusher = new pusher(pusherKey.key, {
        cluster: pusherKey.cluster,
        authEndpoint: `${environment.apiUrl}/${apiPathConstant.dashboardController.PUSHER_AUTH}`,
        auth: {
          params: {
            id: `${this.commentItem.videoDetailId}`
          },
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('currentUser')).access_token}`
          }
        }
      });
      this.channelName = `private-${this.commentItem.videoDetailId}`;
      this.pusher.subscribe(this.channelName);
      this.pusher.bind(PUSHER_EVENT.COMMENT_CREATED, this.createComment.bind(this));
      this.pusher.bind(PUSHER_EVENT.COMMENT_UPDATED, this.updateComment.bind(this));
      this.pusher.bind(PUSHER_EVENT.COMMENT_DELETED, this.deleteComment.bind(this));
      this.pusher.bind(PUSHER_EVENT.REPLY_CREATED, this.createReply.bind(this));
      this.pusher.bind(PUSHER_EVENT.REPLY_UPDATED, this.createReply.bind(this)); // logic similar create
      this.pusher.bind(PUSHER_EVENT.REPLY_DELETED, this.createReply.bind(this)); // logic similar create

      this.listComment = this.formatCommentList(res.content ? res.content : []); // also make list comment in video && in chart
      this.videoChartCommentService.listCommentInVideo.next(this.listCommentInVideo);
      this.videoChartCommentService.listCommentInChart.next(this.listCommentInChart);
    });

    this.innitForm();
    const s1 = this.videoChartCommentService.xmlId.subscribe(xmlId => (this.xmlId = xmlId));
    const s2 = this.videoChartCommentService.scene.subscribe(scene => {
      this.sceneFiltered = scene;
    });
    const s3 = this.videoChartCommentService.currentTime.subscribe(time => (this.currentTimeVideo = time));
    const s4 = this.videoChartCommentService.listSceneActive.subscribe(list => (this.listSceneActived = list));
    const s5 = this.videoChartCommentService.addCommentContextMenu.subscribe(data =>
      this.handleAddCommentContextMenu(data)
    );

    this.subscriptions.push(s1, s2, s3, s4, s5);
  }

  ngAfterViewChecked() {
    if (this.addedAComment) {
      this.scrollCommentToBottom();
      this.addedAComment = false;
    }
  }

  createComment(comment) {
    // Receive new comment from pusher
    if (this.listComment) {
      comment.replies = JSON.parse(comment.replies);
      comment.timeRelative = this.dateUtil.getRelativeTime(
        this.dateUtil.convertTimeZone(comment.timeComment, environment.timeZone),
        environment.timeZone
      );
      const temp = comment.timeInVideo;
      comment.timeInVideo = this.dateUtil.secondsToTime(comment.timeInVideo);
      const index = this.listComment.findIndex(com => comment.id === com.id);
      if (index === -1) {
        // Add new a comment
        this.listComment.push(comment);
        this.updateListComment();
        this.commentData.comment.setValue('');
        if (comment.sceneName === '') {
          this.listCommentInVideo = [...this.listCommentInVideo, ...[temp]];
          this.videoChartCommentService.listCommentInVideo.next(this.listCommentInVideo);
        } else {
          this.listCommentInChart = [
            ...this.listCommentInChart,
            ...[{ scene: comment.sceneName, time: this.dateUtil.secondsToDate(temp) }]
          ];
          this.videoChartCommentService.listCommentInChart.next(this.listCommentInChart);
        }
        this.addedAComment = true;
      }
    }
  }

  updateComment(comment) {
    // Receive new comment from pusher
    if (this.listComment) {
      comment.replies = JSON.parse(comment.replies);
      comment.timeRelative = this.dateUtil.getRelativeTime(
        this.dateUtil.convertTimeZone(comment.timeComment, environment.timeZone),
        environment.timeZone
      );
      comment.timeInVideo = this.dateUtil.secondsToTime(comment.timeInVideo);
      const index = this.listComment.findIndex(com => comment.id === com.id);
      if (index !== -1) {
        // Update comment
        this.listComment[index] = comment;
        this.listComment[index].replies = this.formatReplyList(this.listComment[index].replies);
        this.updateListCommentInChartAndInVideo();
      }
    }
  }

  createReply(comment) {
    // Receive a comment with replies update from pusher
    if (this.listComment) {
      const index = this.listComment.findIndex(cmt => cmt.id === comment.id);
      this.listComment[index].replies = this.formatReplyList(JSON.parse(comment.replies));
      this.listComment[index].timeRelative = this.dateUtil.getRelativeTime(
        this.dateUtil.convertTimeZone(comment.timeComment, environment.timeZone),
        environment.timeZone
      );
    }
  }

  innitForm() {
    // Init form object and validate
    this.commentForm = new FormGroup({
      comment: new FormControl('', [])
    });
  }

  get commentData() {
    return this.commentForm.controls;
  }

  handleAddReply(event) {
    // Save reply to db;
    const indexComment = this.listComment.findIndex(c => c.id === event.commentId);
    const repliesToSave = event.replies;
    this.dashboardService.updateCommentAddReply(event.commentId, JSON.stringify(repliesToSave)).subscribe(data => { });
  }

  handleAddComment() {
    if (!this.processAddComment) {
      if (this.commentData.comment.value.length) {
        this.processAddComment = true;
        this.commentItem.message = this.commentData.comment.value;
        this.commentItem.timeInVideo = this.currentTimeVideo;
        this.commentItem.sceneName = this.videoChartService.getBarSelectedSceneName();
        this.commentItem.userId = this.userId;
        if (this.commentItem.sceneName === '' && this.listSceneActived.indexOf(this.sceneFiltered) !== -1) {
          this.commentItem.sceneName = this.sceneFiltered;
        }
        if(this.commentItem.sceneName !== ''){
          this.commentItem.xmlId = this.xmlId;
        }
        this.dashboardService.addComment(this.commentItem).subscribe(
          data => {
            this.commentData.comment.setValue('');
            this.processAddComment = false;
            delete this.commentItem.xmlId;
          },
          error => {
            this.processAddComment = false;
          }
        );
      }
    }
  }

  formatCommentList(array: any[]) {
    return array.map(ele => {
      if (!ele.sceneName || ele.sceneName === '') {
        this.listCommentInVideo.push(ele.timeInVideo);
      } else if (ele.sceneName !== 'dump') {
        this.listCommentInChart.push({ scene: ele.sceneName, time: this.dateUtil.secondsToDate(ele.timeInVideo) });
      }
      return Object.assign({}, JSON.parse(JSON.stringify(ele)), {
        replies: this.formatReplyList(JSON.parse(ele.replies)),
        timeInVideo: this.dateUtil.secondsToTime(ele.timeInVideo),
        timeComment: ele.timeComment,
        timeRelative: this.dateUtil.getRelativeTime(
          this.dateUtil.convertTimeZone(ele.timeComment, environment.timeZone),
          environment.timeZone
        )
      });
    });
  }

  formatReplyList(array: any[]) {
    return array.map(ele => {
      if (!isNaN(new Date(ele.timeComment).getTime())) {
        return Object.assign({}, JSON.parse(JSON.stringify(ele)), {
          timeComment: ele.timeComment,
          timeRelative: this.dateUtil.getRelativeTime(
            this.dateUtil.convertTimeZone(ele.timeComment, environment.timeZone),
            environment.timeZone
          )
        });
      } else {
        return Object.assign({}, JSON.parse(JSON.stringify(ele)), {
          timeComment: this.dateUtil.getRelativeTime(ele.timeComment, environment.timeZone)
        });
      }
    });
  }

  updateListComment() {
    this.listComment.forEach(c => {
      c.timeRelative = this.dateUtil.getRelativeTime(
        this.dateUtil.convertTimeZone(c.timeComment, environment.timeZone),
        environment.timeZone
      );
    });
  }

  commentItemClick(event: any, commentItem: any) {
    let isInfoRight = false;
    for (const ele of event.path) {
      if (
        ele.classList &&
        (ele.classList.contains('comment-info-right') ||
          ele.classList.contains('button-comment-submenu') ||
          ele.classList.contains('input-group'))
      ) {
        isInfoRight = true;
        break;
      }
    }
    if (!isInfoRight) {
      const timeInVideo = this.dateUtil.stringTimeToSeconds(commentItem.timeInVideo);
      const sceneName = commentItem.sceneName || '';
      this.videoChartCommentService.timeCommentClick.next({ timeInVideo, sceneName });
      this.videoChartService.seek(true, timeInVideo);
      this.videoChartService.seekEnd();
    }
  }

  handleInputCommentClick() {
    if (this.videoChartService.dataVideo.play) {
      this.videoChartService.changeIsPlay(false);
      this.videoChartService.seek(true, this.videoChartService.dataVideo.currentTime);
      this.videoChartService.seekEnd();
    }
  }

  scrollCommentToBottom() {
    try {
      this.commentListContainer.nativeElement.scrollTop = this.commentListContainer.nativeElement.scrollHeight;
    } catch (error) {
      // do nothing
    }
  }

  updateListCommentInChartAndInVideo() {
    this.listCommentInVideo = [];
    this.listCommentInChart = [];
    this.listComment.forEach(ele => {
      if (!ele.sceneName || ele.sceneName === '') {
        this.listCommentInVideo.push(this.dateUtil.stringTimeToSeconds(ele.timeInVideo));
      } else {
        this.listCommentInChart.push({ scene: ele.sceneName, time: this.dateUtil.stringTimeToDate(ele.timeInVideo) });
      }
    });
    this.videoChartCommentService.listCommentInVideo.next(this.listCommentInVideo);
    this.videoChartCommentService.listCommentInChart.next(this.listCommentInChart);
  }

  deleteComment(comment) {
    const indexInList = this.listComment.findIndex(com => comment.id === com.id);
    if (indexInList !== -1) {
      this.listComment.splice(indexInList, 1);
      this.updateListCommentInChartAndInVideo();
    }
  }

  handleAddCommentContextMenu(data: any) {
    if (data.barInfo) {
      this.xmlId = parseInt(data.barInfo.taskName.substring(1, data.barInfo.taskName.indexOf('-')));
      this.inputComment.nativeElement.click();
      this.inputComment.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.pusher.unsubscribe(this.channelName);
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }
}
