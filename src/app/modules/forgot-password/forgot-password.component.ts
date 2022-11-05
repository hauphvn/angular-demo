import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { messageConstant } from '@app/configs/app-constants';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { NAVIGATE } from '@app/configs/app-constants';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  fpForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  error = '';
  TITLE = environment.webTitle;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private toast: ToastrService,
    private spinner: SpinnerService
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.innitForm();
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  innitForm() {
    this.fpForm = new FormGroup({
      email: new FormControl('', [CustomValidator.email, CustomValidator.required, CustomValidator.maxLength(64)])
    });
  }

  get control() {
    return this.fpForm.controls;
  }

  onReset() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.fpForm.invalid) {
      return;
    }

    this.spinner.show();
    // Call API
    this.authService.forgotPassword(this.control.email.value).subscribe(
      res => {
        this.toast.success(messageConstant.FORGOT_PASSWORD.FORGOT_SUCCESS);
        this.spinner.hide();
        this.router.navigate([`/${NAVIGATE.LOGIN}`]);
      },
      error => {
        if (error.error && error.error.status === '400') {
          this.toast.error(messageConstant.FORGOT_PASSWORD.FORGOT_FAIL);
        }
        this.spinner.hide();
      }
    );
  }
}
