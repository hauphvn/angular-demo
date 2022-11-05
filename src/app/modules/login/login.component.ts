import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { messageConstant } from '@app/configs/app-constants';
import { MatDialog } from '@angular/material';
import { Idle, LocalStorage } from '@ng-idle/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  returnUrl: string;
  error = '';
  TITLE = environment.webTitle;
  isShowPassword = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private spinner: SpinnerService,
    private dialogCloseAll: MatDialog,
    private toast: ToastrService,
    private idle: Idle,
    private storage: LocalStorage
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.idle.stop();
    this.innitForm();
    this.dialogCloseAll.closeAll();
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
    this.spinner.hide();
  }

  innitForm() {
    // Init form object and validate
    this.loginForm = new FormGroup({
      email: new FormControl('', [CustomValidator.email, CustomValidator.required, CustomValidator.maxLength(64)]),
      password: new FormControl('', [CustomValidator.rangeLength(8, 40), CustomValidator.required])
    });
  }

  get formData() {
    return this.loginForm.controls;
  }

  // Submit login
  onSubmit() {
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    this.spinner.show();

    // API call
    this.authService.login(this.formData.email.value, this.formData.password.value).subscribe(
      data => {
        if (data) {
          this.idle.watch();
          this.storage.setItem('lasttime', String(Date.now()));
          data.email = this.formData.email.value;
          localStorage.setItem('currentUser', JSON.stringify(data));
          this.authService.currentUserSubject.next(data);
          this.spinner.hide();
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      errorResponse => {
        this.idle.stop();
        this.error = errorResponse;
        this.spinner.hide();
        this.toast.error(messageConstant.LOGIN.LOGIN_FAIL);
      }
    );
  }

  eyeClick() {
    this.isShowPassword = !this.isShowPassword;    
  }
}
