import { DialogComponent } from '@app/shared/components/dialog/dialog.component';
import { MatDialog } from '@angular/material';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) { }

  confirm(params) {
    params.type = 'confirm';
    return this.open(params);
  }

  info(params) {
    params.type = 'info';
    return this.open(params);
  }

  success(params) {
    params.type = 'success';
    return this.open(params);
  }

  error(params) {
    params.type = 'error';
    /**
     * Only show one error popup
     */
    const element = document.getElementById('error');
    return !element && this.open(params);
  }

  // ConfirmWithWarning have icon warning in title
  confirmWithWarning(params) {
    params.type = 'confirm-with-warning';
    return this.open(params);
  }

  input(params) {
    params.type = 'input';
    return this.open(params);
  }

  expired(params) {
    params.type = 'expired';
    /**
     * Only show one error popup
     */
    const element = document.getElementById('expired');
    return !element && this.open(params);
  }

  validationOnSaveXML(params) {
    params.type = 'validationOnSaveXML';
    return this.open(params);
  }

  addNewLable(params) {
    params.type = 'addNewLable';
    return this.open(params);
  }

  delete(params) {
    params.type = 'delete';
    return this.open(params);
  }

  private open(params) {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '430px',
      disableClose: true,
      data: params,
      id: params.type
    });
    return dialogRef.afterClosed();
  }
}
