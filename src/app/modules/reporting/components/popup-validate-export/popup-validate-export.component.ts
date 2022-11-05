import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-popup-validate-export',
  templateUrl: './popup-validate-export.component.html',
  styleUrls: ['./popup-validate-export.component.scss']
})
export class PopupValidateExportComponent implements OnInit {
  invalidateVideoDetails;
  validateVideoDetails;
  constructor(
    public dialogRef: MatDialogRef<PopupValidateExportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.invalidateVideoDetails = this.data.invalidateVideoDetails;
    this.validateVideoDetails = this.data.validateVideoDetails;
  }

  closePopup() {
    this.dialogRef.close();
  }

  handleSave() {
    this.dialogRef.close(true);
  }

}
