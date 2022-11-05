import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { messageConstant, userRoleOptions } from '@app/configs/app-constants';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatChipInputEvent, MatAutocompleteSelectedEvent } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { UserGroupAvailableModel } from '@app/shared/models/systemManagementModel';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-popup-edit-userlist',
  templateUrl: './popup-edit-userlist.component.html',
  styleUrls: ['./popup-edit-userlist.component.scss']
})
export class PopupEditUserlistComponent implements OnInit {
  editForm: FormGroup;
  enableSaveButton = false;
  separatorKeysCodes = [ENTER, COMMA];
  userGroupSelected: any[];
  userGroupInserted: any[];
  userGroupDeleted: any[];
  userGroupBackup: any[];
  // fullUserGroupList: any[];
  fullUserGroupList: Observable<UserGroupAvailableModel[]>;
  userRoleOptions = userRoleOptions;
  options: UserGroupAvailableModel[] = [];
  @ViewChild('fruitInput', { static: true }) fruitInput: ElementRef;
  constructor(
    private spinnerService: SpinnerService,
    private toastrService: ToastrService,
    private sysManagementService: SystemManagementService,
    private dialog: DialogService,
    public dialogRef: MatDialogRef<PopupEditUserlistComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userGroupSelected = [];
    this.userGroupInserted = [];
    this.userGroupDeleted = [];
  }

  ngOnInit() {
    this.getAllUserGroupAvailable();
    this.initForm();
    this.userGroupSelected = [...this.data.group];
    this.userGroupBackup = JSON.parse(JSON.stringify(this.data.group));
  }
  reloadButtonSave() {
    const name = this.editForm.get('name');
    const email = this.editForm.get('email');
    const password = this.editForm.get('password');
    const comment = this.editForm.get('comment');
    this.enableSaveButton = name.valid && email.valid && password.valid && comment.valid;
  }
  initForm() {
    // Init form object and validate
    this.editForm = new FormGroup({
      email: new FormControl(this.data.email, [
        CustomValidator.email,
        CustomValidator.maxLength(64),
        CustomValidator.required
      ]),
      password: new FormControl('', [CustomValidator.rangeLengthExceptNone(8, 40)]),
      name: new FormControl(this.data.fullName, [
        CustomValidator.maxLength(200),
        CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.SPECIAL_CHARACTER),
        CustomValidator.required
      ]),
      comment: new FormControl(this.data.description || '', [CustomValidator.maxLength(200)]),
      userGroup: new FormControl(''),
      userRole: new FormControl(this.getOptionActive(this.data.role), [])
    });
  }

  get formData() {
    return this.editForm.controls;
  }

  getAllUserGroupAvailable() {
    this.spinnerService.show();
    this.sysManagementService.getUserGroupAvaiable().subscribe(
      list => {
        this.spinnerService.hide();
        this.options = list.filter(
          userGroup => {
            return this.userGroupBackup.findIndex(groupBackup => +groupBackup.id === +userGroup.id) === -1
          });
        this.fullUserGroupList = this.editForm.get('userGroup').valueChanges.pipe(
          startWith(null),
          map((value: string | null) =>  {
            return (value ? this._filter(value) : this._filter(''))
          })
        )
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  _filter(value) {
    return this.options.filter(x => x.name.toLowerCase().includes(value.toLowerCase()));
  }

  onSaveClick() {
    if (this.editForm.invalid) {
      return;
    }
    const { email, password, name, comment, userRole } = this.formData;
    const dataUpdate = {
      id: this.data.id,
      email: email.value,
      password: password.value,
      fullName: name.value,
      description: comment.value,
      userGroups_deleted: this.userGroupDeleted.map(g => g.id),
      userGroups_insert: this.userGroupInserted.map(g => g.id),
      role: userRole.value['key']
    };
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save all change?'
    };
    this.dialog.confirm(param).subscribe(
      result => {
        if (result) {
          this.spinnerService.show();
          this.sysManagementService.updateUser(dataUpdate).subscribe(
            res => {
              this.spinnerService.hide();
              this.toastrService.success(messageConstant.USER_MANAGEMENT.UPDATE_USER_SUCCESS);
              this.dialogRef.close(true);
            },
            error => {
              this.spinnerService.hide();
              this.toastrService.error(messageConstant.USER_MANAGEMENT.UPDATE_USER_FAIL);
            }
          );
        }
      },
      error => {
        this.spinnerService.hide();
        this.toastrService.error(messageConstant.USER_MANAGEMENT.UPDATE_USER_FAIL);
      }
    );
  }

  add(event: MatChipInputEvent): void {
    // on event when type enter from key board
    const input = event.input;
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this.editForm.get('userGroup').setValue(null);
    this.reloadButtonSave();
  }

  remove(data: any): void {
    const { id } = data;
    // Check in backup
    const indexInInsert = this.userGroupInserted.findIndex(user => user.id === +id);
    if (indexInInsert !== -1) {
      // In insert => remove in insert
      this.userGroupInserted.splice(indexInInsert, 1);
      this.options.splice(indexInInsert, 1);
    } else {
      // Not in insert => push to delete
      this.userGroupDeleted.push(data);
      this.options.push(data);
    }
    this.userGroupSelected = this.userGroupSelected.filter(x => x.id !== +id);
    this.reloadButtonSave();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    // on event when click text label
    const { id, value } = event.option;
    const indexInDelete = this.userGroupDeleted.findIndex(user => user.id === +id);
    if (indexInDelete !== -1) {
      // In delete => remove in delete
      this.userGroupDeleted.splice(indexInDelete, 1);
    } else {
      // Not in delete => push to insert
      this.userGroupInserted.push({ id, name: value });
    }
    this.userGroupSelected.push({ id, name: value });
    this.options = this.options.filter(x => x.id !== +id);
    this.fruitInput.nativeElement.value = '';
    this.fruitInput.nativeElement.blur();
    this.editForm.get('userGroup').setValue(null);
    this.reloadButtonSave();
  }

  getOptionActive (id) {
    const dataFilter = this.userRoleOptions.filter(item => item['key'] === id);
    return dataFilter[0];
  }
}
