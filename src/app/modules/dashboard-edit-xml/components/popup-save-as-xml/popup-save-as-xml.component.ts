import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-popup-save-as-xml',
  templateUrl: './popup-save-as-xml.component.html',
  styleUrls: ['./popup-save-as-xml.component.scss']
})
export class PopupSaveAsXmlComponent implements OnInit {
  newNameXML: string;
  constructor(
    public dialogRef: MatDialogRef<PopupSaveAsXmlComponent>
  ) { }

  ngOnInit() {
  }

  onEnterNameXML(name: any) {
    this.newNameXML = (name as HTMLInputElement).value;
  }

  closeModal() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.newNameXML);
  }
}
