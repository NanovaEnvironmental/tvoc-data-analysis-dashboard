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

  public openFileVisualizationDialog(signals: Signal[], row: number, file:File) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = {'signals':signals, 'row': row, 'file': file}
    dialogConfig.width = "80%"
    dialogConfig.height = "85%"
    return this.dialog.open(FileVisualizationComponent, dialogConfig)
  }

  public openMsgDialog(msg: string) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = msg
    dialogConfig.width = "30%"
    dialogConfig.height = "15%"
    return this.dialog.open(PopupComponent, dialogConfig)
  }

  public openFinalResultDialog(signals: Signal[][][], concentrations: number[]) {
    let dialogConfig = new MatDialogConfig()
    dialogConfig.data = {'signals': signals, 'concentrations': concentrations}
    dialogConfig.width = "120%"
    dialogConfig.height = "100%"
    return this.dialog.open(FinalResultComponent, dialogConfig)
  }
}
