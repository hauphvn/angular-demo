import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-popup-confirm-assign-usergroup',
  templateUrl: './popup-confirm-assign-usergroup.component.html',
  styleUrls: ['./popup-confirm-assign-usergroup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PopupConfirmAssignUsergroupComponent implements OnInit {
  constructor(
    private spinnerService: SpinnerService,
    private sysManagementService: SystemManagementService,
    private toastrService: ToastrService,
    public dialogRef: MatDialogRef<PopupConfirmAssignUsergroupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.confirmAddString = '';
    this.confirmDeleteString = '';
  }

  confirmDeleteString: string;
  confirmAddString: string;

  ngOnInit() {
    this.data.confirmDeleteList.forEach((item, index) => {
      if (index !== 0) {
        this.confirmDeleteString += `、${item}`;
      } else {
        this.confirmDeleteString += item;
      }
    });
    this.data.confirmAddList.forEach((item, index) => {
      if (index !== 0) {
        this.confirmAddString += `、${item}`;
      } else {
        this.confirmAddString += item;
      }
    });
  }

  onSaveClick() {
    const { listToSave } = this.data;
    this.spinnerService.show();
    this.sysManagementService.assignUserGroups(listToSave).subscribe(
      res => {
        this.spinnerService.hide();
        this.toastrService.success('Saved successfully');
        this.dialogRef.close(true);
      },
      error => {
        this.spinnerService.hide();
        this.toastrService.error('Save failed');
      }
    );
  }
}
