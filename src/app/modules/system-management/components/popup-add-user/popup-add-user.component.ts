import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatChipInputEvent, MatAutocompleteSelectedEvent } from '@angular/material';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { UserGroupAvailableModel } from '@app/shared/models/systemManagementModel';
import { messageConstant, userRoleOptions } from '@app/configs/app-constants';
@Component({
  selector: 'app-popup-add-user',
  templateUrl: './popup-add-user.component.html',
  styleUrls: ['./popup-add-user.component.scss']
})
export class PopupAddUserComponent implements OnInit {
  email: string;
  password: string;
  form: FormGroup;
  name: string;

  currentUserGroup: any;
  userGroupValueText: string;
  myControl = new FormControl();
  enableSave = false;
  options: UserGroupAvailableModel[] = [];
  filteredOptions: Observable<UserGroupAvailableModel[]>;

  userGroupSelected: any[];
  separatorKeysCodes = [ENTER, COMMA];
  userRole = userRoleOptions[0];
  userRoleOptions = userRoleOptions;
  @ViewChild('fruitInput', { static: true }) fruitInput: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<PopupAddUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private dialog: DialogService,
    private systemService: SystemManagementService
  ) {
    this.userGroupSelected = [];
  }

  ngOnInit() {
    this.initForm();
    this.getUserGroup();
  }
  catchError(err) {
    this.spinner.hide();
    this.toastr.error(err.message || err);
  }
  getUserGroup() {
    this.spinner.show();
    this.systemService.getUserGroupAvaiable().subscribe(group => {
      this.spinner.hide();
      this.options = group;
      // this.filteredOptions = this.myControl.valueChanges.pipe(
      //   startWith(''),
      //   map(value => this._filter(value))
      // );
      this.filteredOptions = this.form.get('userGroup').valueChanges.pipe(
        startWith(null),
        map((value: string | null) =>  (value ? this._filter(value) : this._filter('')))
      )
    }, this.catchError.bind(this));
  }
  saveUser() {
    const email = this.form.get('email').value;
    const password = this.form.get('password').value;
    const fullName = this.form.get('name').value;
    const group = this.userGroupSelected.map(userGroup => userGroup.id);
    const description = this.form.get('description').value;
    const role = this.form.get('userRole').value['key'];
    const data = {
      description,
      fullName,
      group,
      password,
      email,
      role
    };
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save all change?'
    };
    this.dialog.confirm(param).subscribe(res => {
      if (res) {
        this.spinner.show();
        this.systemService.insertUser(data).subscribe(
          result => {
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.USER_LIST_ADD_SUCESS);
            this.dialogRef.close(true);
          },
          err => {
            this.spinner.hide();
            if (err.status === 400) {
              this.toastr.error(messageConstant.USER_MANAGEMENT.ADD_USER_ALREADY_EXIST);
            } else {
              this.catchError(err);
            }
          }
        );
      }
    }, this.catchError.bind(this));
  }
  initForm() {
    this.form = new FormGroup({
      email: new FormControl('', [CustomValidator.email, CustomValidator.required, CustomValidator.maxLength(64)]),
      password: new FormControl('', [CustomValidator.rangeLength(8, 40), CustomValidator.required]),
      name: new FormControl('', [
        CustomValidator.maxLength(200),
        CustomValidator.required,
        CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.SPECIAL_CHARACTER)
      ]),
      description: new FormControl('', [CustomValidator.maxLength(200)]),
      userGroup: new FormControl('', []),
      userRole: new FormControl(this.userRole, [])
    });
  }
  closePopup() {
    this.dialogRef.close();
  }
  _filter(value) {
    return this.options.filter(x => x.name.toLowerCase().includes(value.toLowerCase()));
  }
  handleSelected(event) {
    const { option } = event;
    this.currentUserGroup = {
      id: option.id,
      text: option.value
    };
  }
  unfocus() {
    if (this.currentUserGroup && this.currentUserGroup.id) {
      this.userGroupValueText = this.currentUserGroup.text;
    } else {
      this.userGroupValueText = '';
    }
  }
  changeEmail(e) {
    this.email = e;
  }
  changeUserGroup(e) {
    this.userGroupValueText = e;
  }
  reloadButtonSave() {
    const email = this.form.get('email');
    const name = this.form.get('name');
    const password = this.form.get('password');
    const description = this.form.get('description');
    this.enableSave = email.valid && name.valid && password.valid && description.valid;
  }

  remove(data: any): void {
    const { id } = data;
    this.userGroupSelected = this.userGroupSelected.filter(x => x.id !== +id);
    this.options.push(data);
    this.reloadButtonSave();
  }

  add(event: MatChipInputEvent): void {
    // on event when type enter from key board
    const input = event.input;
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this.reloadButtonSave();
    this.form.get('userGroup').setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    // on event when click text label
    const { id } = event.option;
    const user = this.options.find(x => x.id === +id);
    if (user) {
      this.userGroupSelected.push(user);
      this.options = this.options.filter(x => x.id !== +id);
    }
    this.fruitInput.nativeElement.value = '';
    this.fruitInput.nativeElement.blur();
    this.form.get('userGroup').setValue(null);
    this.reloadButtonSave();
  }
}
