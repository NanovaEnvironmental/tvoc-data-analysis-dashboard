import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {

  public msg: string
  constructor(@Inject(MAT_DIALOG_DATA) msg: string, private dialogRef: MatDialogRef<PopupComponent>) { 
    this.msg = msg
  }

  ngOnInit(): void {
  }

  public onCloseClick(): void {
    this.dialogRef.close()
  }
}
