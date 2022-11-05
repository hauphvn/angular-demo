import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
  type: string;
  title: string;
  message: string;
  inputField: string = '';
  inputLabelField: string;
  maxLenghtInputField: number;

  constructor(public dialogRef: MatDialogRef<DialogComponent>, @Inject(MAT_DIALOG_DATA) data: any) {
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.inputField = data.inputField;
    this.inputLabelField = data.inputLabelField;
    this.maxLenghtInputField = data.maxLenghtInputField;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
