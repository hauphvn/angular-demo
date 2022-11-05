import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { messageConstant } from '@app/configs/app-constants';

@Component({
  selector: 'app-popup-add-folder',
  templateUrl: './popup-add-folder.component.html',
  styleUrls: ['./popup-add-folder.component.scss']
})
export class PopupAddFolderComponent implements OnInit {
  form: FormGroup;
  enableButton = false;
  constructor(
    public dialogRef: MatDialogRef<PopupAddFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: DialogService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private systemService: SystemManagementService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = new FormGroup({
      name: new FormControl('', [
        CustomValidator.required,
        CustomValidator.maxLength(200),
        CustomValidator.checkSpecialCharacter(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_SPECIAL_CHARACTER)
      ])
    });
  }
  reloadButtonSave() {
    this.enableButton = this.form.get('name').valid;
  }
  closePopup() {
    this.dialogRef.close();
  }
  catchError(err) {
    this.spinner.hide();
    if (err.status === 400) {
      this.toastr.error(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPDATE_DUPLICATE);
    } else {
      this.toastr.error(err.message || err);
    }
  }
  handleSave() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save all change?'
    };
    this.dialog.confirm(param).subscribe(isOK => {
      if (isOK) {
        this.spinner.show();
        const name = this.form.get('name').value;
        const options = {
          name: name.trim(),
          project_id: this.data.projectId
        };
        this.systemService.addFolder(options).subscribe(data => {
          this.spinner.hide();
          this.toastr.success(messageConstant.PROJECT_MANAGEMENT.FOLDER_UPLOAD_SUCCESS);
          this.dialogRef.close(data);
        }, this.catchError.bind(this));
      }
    }, this.catchError.bind(this));
  }
}
