import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FileVisualizationComponent } from 'src/app/components/dialogs/file-visualization/file-visualization.component';
import { FinalResultComponent } from 'src/app/components/dialogs/final-result/final-result.component';
import { PopupComponent } from 'src/app/components/dialogs/popup/popup.component';
import { Signal } from 'src/app/interfaces/signal';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(public dialog: MatDialog) { }

  public openFileVisualizationDialog(signals: Signal[]) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = signals
    dialogConfig.width = "80%"
    dialogConfig.height = "90%"
    return this.dialog.open(FileVisualizationComponent, dialogConfig)
  }

  public openMsgDialog(msg: string) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = msg
    dialogConfig.width = "30%"
    dialogConfig.height = "15%"
    return this.dialog.open(PopupComponent, dialogConfig)
  }

  public openFinalResultDialog(signals: Signal[][][]) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = signals
    dialogConfig.width = "100%"
    dialogConfig.height = "90%"
    return this.dialog.open(FinalResultComponent, dialogConfig)
  }
}
