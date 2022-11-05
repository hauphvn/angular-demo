import { Router, NavigationEnd } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { LocalStorage, Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { environment } from '@environments/environment';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { ToastrService } from 'ngx-toastr';
import { Keepalive } from '@ng-idle/keepalive';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  headerShow = false;
  setTimeout = environment.timeout;
  timedOut = false;
  lastPing?: Date = null;
  isIframe = false;
  constructor(
    private authenticationService: AuthenticationService,
    private idle: Idle,
    private storge: LocalStorage,
    private dialog: DialogService,
    private toastr: ToastrService,
    private keepalive: Keepalive,
    private titleService: Title,
    private router: Router
  ) {
    this.titleService.setTitle(environment.webTitle);
    if (
      this.storge.getItem('lasttime') &&
      Number(this.storge.getItem('lasttime')) + this.setTimeout * 60 * 1000 < Date.now()
    ) {
      if (localStorage.getItem('currentUser')) {
        this.authenticationService.logout();
      }
    }
    this.sessionTimeout();
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this.isIframe = event.url.includes('iframe-dashboard');
        this.authenticationService.currentUser.subscribe(user => {
          this.headerShow = !!user && !this.isIframe;
        });
      }
    });
  }

  ngOnInit() {
  }

  sessionTimeout() {
    // sets a timeout session in eviroment
    this.idle.setIdle(this.setTimeout * 60);
    // sets a timeout period of 5 seconds.
    this.idle.setTimeout(5);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onTimeout.subscribe(res => {
      this.timedOut = true;
      const param = {
        type: 'info',
        title: 'INFORM',
        message: 'Session time out!'
      };
      this.dialog.info(param).subscribe(rs => {
        this.toastr.clear();
        this.authenticationService.logout();
      });
    });

    this.idle.onInterrupt.subscribe(res => {
      this.lastPing = new Date();
      this.storge.setItem('lasttime', String(this.lastPing.getTime()));
    });

    this.keepalive.interval(15);

    this.idle.watch();
  }
}
