import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, FormGroup, Form } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { MatChipInputEvent, MatAutocompleteSelectedEvent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { startWith, map } from 'rxjs/operators';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { UserAvailableModel } from '@app/shared/models/systemManagementModel';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import {
  messageConstant,
  ErrorCodeConstant,
  baseRoleOptions,
  baseRoleCheckBoxOptions,
  BASEROLE_CHECKBOX
} from '@app/configs/app-constants';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-popup-user-group',
  templateUrl: './popup-user-group.component.html',
  styleUrls: ['./popup-user-group.component.scss']
})
export class PopupUserGroupComponent implements OnInit {
  userGroupId: number;
  titleHeader = 'ADD USER GROUP';
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  name: string;
  description: string;
  separatorKeysCodes = [ENTER, COMMA];
  userBackup: UserAvailableModel[] = [];
  userGroupCtrl = new FormControl();
  userSelected: UserAvailableModel[] = [];
  allUsers: UserAvailableModel[] = [];
  enableButton = false;
  userInserted = [];
  userDeleted = [];
  filteredUser: Observable<UserAvailableModel[]>;
  @ViewChild('fruitInput', { static: true }) fruitInput: ElementRef;
  form: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<PopupUserGroupComponent>,
    @Inject(MAT_DIALOG_DATA) public userGroup: any,
    private systemService: SystemManagementService,
    private toastr: ToastrService,
    private spinner: SpinnerService,
    private dialog: DialogService
  ) {}
  baseRoleOptions = baseRoleOptions;
  baseRoleCheckBoxOptions =baseRoleCheckBoxOptions;
  optionSelectDefault: number = 1;

  ngOnInit() {
    this.loadUserAvaiable();
    this.initForm();
    this.reloadButtonSave();
    if (this.userGroup) {
      this.initUserGroup();
      this.enableButton = false;
    }
  }
  initUserGroup() {
    // init data and edit title
    this.titleHeader = 'EDIT USER GROUP';
    const member = this.userGroup.users.map(x => x.fullName).join(',');
    this.name = this.userGroup.name;
    this.userSelected = [...this.userGroup.users];
    this.userBackup = this.userBackup.concat(this.userSelected);
    this.description = this.userGroup.description;
    const selectedBaseRole =
      this.userGroup.policy_pattern &&
      this.userGroup.policy_pattern &&
      this.getOptionActive(this.userGroup.policy_pattern[0]) ||
      this.getOptionActive(this.optionSelectDefault);
    const dataDl = this.userGroup.policy_pattern && this.userGroup.policy_pattern.filter(item => item === BASEROLE_CHECKBOX.DATADL) || [];
    const xmlEdit = this.userGroup.policy_pattern && this.userGroup.policy_pattern.filter(item => item === BASEROLE_CHECKBOX.XMLEDIT) || [];

    this.form = new FormGroup({
      groupName: new FormControl(this.name, [
        CustomValidator.required,
        CustomValidator.maxLength(200),
        CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.USERGROUP_SPECIAL_CHARACTER)
      ]),
      member: new FormControl(member, []),
      description: new FormControl(this.description, [CustomValidator.maxLength(200)]),
      selectedBaseRole: new FormControl(selectedBaseRole, []),
      dataDl: new FormControl(dataDl, []),
      xmlEdit: new FormControl(xmlEdit, []),
    });
  }
  initForm() {
    this.form = new FormGroup({
      groupName: new FormControl('', [
        CustomValidator.required,
        CustomValidator.maxLength(200),
        CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.USERGROUP_SPECIAL_CHARACTER)
      ]),
      member: new FormControl('', []),
      description: new FormControl('', [CustomValidator.maxLength(200)]),
      selectedBaseRole: new FormControl(this.getOptionActive(this.optionSelectDefault), []),
      dataDl: new FormControl([], []),
      xmlEdit: new FormControl([], []),
    });
  }
  add(event: MatChipInputEvent): void {
    // on event when type enter from key board
    const input = event.input;
    const value = event.value;
    const user = this.allUsers.find(x => x.fullName.toLowerCase() === value.toLowerCase());
    if (user) {
      this.userSelected.push(user);
      this.allUsers = this.allUsers.filter(x => x.id !== user.id);
      if (this.userGroup) {
        this.userInserted.push(user);
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.userGroupCtrl.setValue(null);
    this.reloadButtonSave();
  }
  remove(data: any): void {
    const { id, fullName } = data;
    if (this.userGroup) {
      this.userDeleted.push({ id, fullName });
    }
    this.userSelected = this.userSelected.filter(x => x.id !== +id);
    const user = this.userBackup.find(x => x.id === +id);
    if (user) {
      this.allUsers.push(user);
      this.reloadButtonSave();
    } else {
      // restore data available
      const usr = new UserAvailableModel();
      usr.id = id;
      usr.fullName = fullName;
      this.allUsers.push(usr);
    }
    this.filteredUser = this.userGroupCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filter(value))
    );
  }

  filter(value) {
    if (!value) {
      return this.allUsers.filter(x => this.userSelected.filter(user => user.id === x.id).length === 0);
    }
    return this.allUsers.filter(x => x.fullName.toLowerCase().includes(value.toLowerCase()));
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    // on event when click text label
    const { id } = event.option;
    const user = this.userBackup.find(x => x.id === +id);
    if (user) {
      this.userSelected.push(user);
      this.allUsers = this.userBackup.filter(x => this.userSelected.filter(u => u.id === x.id).length === 0);
      this.fruitInput.nativeElement.value = '';
      this.fruitInput.nativeElement.blur();
      this.userGroupCtrl.setValue(null);
      if (this.userGroup) {
        this.userInserted.push(user);
      }
    }
    this.reloadButtonSave();
  }
  reloadButtonSave() {
    const groupName = this.form.get('groupName');
    const description = this.form.get('description');
    if (groupName.valid && groupName.value && description.valid) {
      this.enableButton = true;
    } else {
      this.enableButton = false;
    }
  }
  closePopup() {
    this.dialogRef.close();
  }
  save() {
    const param = {
      type: 'confirm',
      title: 'CONFIRM',
      message: 'Do you want to save all change?'
    };
    this.dialog.confirm(param).subscribe(result => {
      if (result) {
        if (this.userGroup) {
          // check upload or insert mode
          this.update();
        } else {
          this.insert();
        }
      }
    }, this.catchError.bind(this));
  }
  insert() {
    const data = {
      description: this.form.get('description').value,
      name: this.form.get('groupName').value,
      users: this.userSelected.map(x => x.id),
      policy_pattern: [
        this.form.get('selectedBaseRole').value.key,
        ...this.form.get('dataDl').value,
        ...this.form.get('xmlEdit').value,
      ]
    };
    this.spinner.show();
    this.systemService.insertUserGroup(data).subscribe(result => {
      this.spinner.hide();
      this.toastr.success(messageConstant.USER_MANAGEMENT.USERGROUP_ADD_SUCCESS);
      this.dialogRef.close(result);
    }, this.catchError.bind(this));
  }
  update() {
    const data = {
      description: this.form.get('description').value,
      name: this.form.get('groupName').value,
      user_group_id: this.userGroup.id,
      users_deleted: this.userDeleted.map(x => x.id),
      users_insert: this.userInserted.map(x => x.id),
      policy_pattern: [
        this.form.get('selectedBaseRole').value.key,
        ...this.form.get('dataDl').value,
        ...this.form.get('xmlEdit').value,
      ]
    };
    this.spinner.show();
    this.systemService.updateUserGroup(data).subscribe(result => {
      this.spinner.hide();
      this.toastr.success(messageConstant.USER_MANAGEMENT.USERGROUP_UPDATE_SUCCESS);
      this.dialogRef.close(result);
    }, this.catchError.bind(this));
  }
  catchError(err) {
    this.spinner.hide();
    if (err instanceof HttpErrorResponse) {
      switch (err.error.message) {
        case ErrorCodeConstant.NAME_ALREADY:
          this.toastr.error(messageConstant.USER_MANAGEMENT.USERGROUP_DUPLICATE);
          break;
        case ErrorCodeConstant.NAME_EMPTY:
          this.toastr.error(messageConstant.USER_MANAGEMENT.USERGROUP_EMPTY);
          break;
        case ErrorCodeConstant.NAME_SPECIAL:
          this.toastr.error(messageConstant.USER_MANAGEMENT.USERGROUP_SPECIAL_CHARACTER);
          break;
        default:
          this.toastr.error(messageConstant.USER_MANAGEMENT.USERGROUP_NOT_EXIST);
          this.dialogRef.close(true); // reload page
          break;
      }
    } else {
      this.toastr.error(err.message || err);
    }
  }
  loadUserAvaiable() {
    this.systemService.getUserAvaiable().subscribe(user => {
      // remove user avaiable
      user = user.filter(x => this.allUsers.filter(u => u.id === x.id).length === 0);
      this.allUsers = this.allUsers.concat(user);
      this.userBackup = this.userBackup.concat(user); // backup data for restore data
      this.spinner.hide();
      this.filteredUser = this.userGroupCtrl.valueChanges.pipe(
        startWith(''),
        map(value => this.filter(value))
      );
    }, this.catchError.bind(this));
  }

  getOptionActive (id) {
    const dataFilter = this.baseRoleOptions.filter(item => item['key'] === id);
    return dataFilter[0];
  }
}
