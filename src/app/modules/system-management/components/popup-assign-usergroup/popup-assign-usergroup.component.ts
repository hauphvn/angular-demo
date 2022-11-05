import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { PopupConfirmAssignUsergroupComponent } from '../popup-confirm-assign-usergroup/popup-confirm-assign-usergroup.component';

@Component({
  selector: 'app-popup-assign-usergroup',
  templateUrl: './popup-assign-usergroup.component.html',
  styleUrls: ['./popup-assign-usergroup.component.scss']
})
export class PopupAssignUsergroupComponent implements OnInit {
  assignUserGroupForm: FormGroup;
  listUserGroup: any[];
  listUserGroupShow: any[];
  selectedUserGroup: string[];

  confirmDeleteUserGroup: string[];
  confirmAddUserGroup: string[];

  listToSave: any;
  cols: any[];
  enableSave = false;
  constructor(
    private spinnerService: SpinnerService,
    private sysManagementService: SystemManagementService,
    private toastrService: ToastrService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PopupAssignUsergroupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.cols = [{ field: 'noneHeader', header: '' }];
  }

  ngOnInit() {
    this.selectedUserGroup = this.data.dataDialog.map(item => `${item.id}__${item.name}`);
    this.sysManagementService.getUserGroupAll().subscribe(res => {
      this.listUserGroup = res;
      this.listUserGroupShow = JSON.parse(JSON.stringify(this.listUserGroup));
    });
    this.initForm();
  }

  initForm() {
    // Init form object and validate
    // this.assignUserGroupForm = new FormGroup({
    //   userGroups: new FormArray([])
    // });
  }

  searchTable(value: string) {
    this.listUserGroupShow = this.listUserGroup.filter(item => item.name.includes(value));
  }

  get formData() {
    return this.assignUserGroupForm.controls;
  }

  onSaveClick() {
    this.makeConfirmDeleteList();
    this.makeConfirmAddList();
    this.makeDataToSave();
    if (this.confirmAddUserGroup.length + this.confirmDeleteUserGroup.length > 0) {
      const dialogConfirmRef = this.dialog.open(PopupConfirmAssignUsergroupComponent, {
        width: '480px',
        disableClose: true,
        data: {
          confirmDeleteList: this.confirmDeleteUserGroup,
          confirmAddList: this.confirmAddUserGroup,
          listToSave: this.listToSave
        }
      });

      dialogConfirmRef.afterClosed().subscribe(result => {
        if (result) {
          this.dialogRef.close(true);
        }
      });
    }
  }
  makeDataToSave() {
    this.listToSave = { projectId: this.data.projectId, userGroups: [] };
    this.listToSave.userGroups = this.selectedUserGroup.map(i => i.split('__')[0]);
  }

  makeConfirmDeleteList() {
    // Item that exist in data list but selectedUserGroup list
    this.confirmDeleteUserGroup = this.data.dataDialog
      .filter(item => this.selectedUserGroup.indexOf(`${item.id}__${item.name}`) === -1)
      .map(i => i.name);
  }

  makeConfirmAddList() {
    // Item that exist in selectedUserGroup list but data list
    this.confirmAddUserGroup = this.selectedUserGroup
      .filter(item => this.data.dataDialog.findIndex(d => +d.id === +item.split('__')[0]) === -1)
      .map(i => i.split('__')[1]);
  }
}
