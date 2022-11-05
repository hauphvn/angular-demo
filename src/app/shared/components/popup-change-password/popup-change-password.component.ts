import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { UserManagementService } from '@app/core/services/server-services/usermanagement.service';
import { ToastrService } from 'ngx-toastr';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { AuthenticationService } from '@app/core/authentication/authentication.service';

@Component({
  selector: 'app-popup-change-password',
  templateUrl: './popup-change-password.component.html',
  styleUrls: ['./popup-change-password.component.scss']
})
export class PopupChangePasswordComponent implements OnInit {
  changePassForm: FormGroup;
  typePassword = [
    {
      type: 'password',
      name: 'oldPass'
    },
    {
      type: 'password',
      name: 'newPass'
    },
    {
      type: 'password',
      name: 'confirmPass'
    }
  ]
  constructor(
    private spinnerService: SpinnerService,
    private userManagementService: UserManagementService,
    private toastrService: ToastrService,
    private dialog: DialogService,
    private authService: AuthenticationService,
    private dialogCloseAll: MatDialog,
    public dialogRef: MatDialogRef<PopupChangePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    // Init form object and validate
    this.changePassForm = new FormGroup(
      {
        oldPass: new FormControl('', [CustomValidator.rangeLength(8, 40), CustomValidator.required]),
        newPass: new FormControl('', [CustomValidator.rangeLength(8, 40), CustomValidator.required]),
        confirmPass: new FormControl('', [CustomValidator.rangeLength(8, 40), CustomValidator.required])
      },
      {
        validators: CustomValidator.matchField('newPass', 'confirmPass')
      }
    );
  }

  get formData() {
    return this.changePassForm.controls;
  }

  onSaveClick() {
    if (this.changePassForm.invalid) {
      return;
    }
    this.spinnerService.show();
    const { oldPass, newPass, confirmPass } = this.changePassForm.controls;
    this.userManagementService.changePassword(oldPass.value, newPass.value, confirmPass.value).subscribe(
      res => {
        this.spinnerService.hide();
        const param = {
          type: 'info',
          title: 'INFORM',
          message: `Password changed successfully.\nPlease login again.`
        };
        this.dialog.info(param).subscribe(response => {
          if (response) {
            this.authService.logout();
          }
        });
        this.dialogRef.close();
      },
      errors => {
        this.spinnerService.hide();
        this.toastrService.error('Password change fail.');
      }
    );
  }

  eyeClick(name) {
    this.typePassword = this.typePassword.filter(item => {
      if (item.name === name) {
        if (item.type === 'password') {
          item.type = 'text';
        } else {
          item.type = 'password';
        }
      }
      return item;
    })
  }

  customPassword (name) {
    const typeFilter = this.typePassword.filter(item => item.name === name);
    return typeFilter[0].type;
  }
}
