import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { constants } from 'src/app/constants/constants';
import { Signal } from 'src/app/interfaces/signal';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { UtilService } from 'src/app/services/util/util.service';

@Component({
  selector: 'app-final-result',
  templateUrl: './final-result.component.html',
  styleUrls: ['./final-result.component.scss']
})
export class FinalResultComponent implements OnInit {

  public signals: Signal[][][]
  public concentrations: number[]
  private testResults = []

  private signalsMatrixRows(): number {
    return this.signals.length
  }

  private signalsMatrixColumns(): number {
    return this.signals[0].length
  }

  public DatailTableDataSource: MatTableDataSource<any>
  public detailTableDisplayedColumns: string[] = []

  public ResultTableDataSource: MatTableDataSource<any>
  public resultTableDisplayedColumns: string[] = []

  constructor(@Inject(MAT_DIALOG_DATA) data: any, private analysisService: AnalysisService, private utilService: UtilService, 
    private dialogService: DialogService, private dialogRef: MatDialogRef<FinalResultComponent>) { 
    this.signals = data.signals
    this.concentrations = data.concentrations
    console.log(this.concentrations)
  }

  ngOnInit(): void {
    try {
      this.testResults = this.initializeResultMatrix(this.signals)
      let testInfo = this.parseSignals(this.signals)
      this.visualizeDetailTable(testInfo, this.testResults)
      this.visualizeResultTable(testInfo, this.testResults)
    } catch(err) {
      let msg = err.msg == undefined? "未知错误":err.msg
      this.dialogService.openMsgDialog(msg)
    }
  }

  private parseSignals(signals: Signal[][][]): any {
    return {PIDNames: this.getPIDNames(signals), concentrations: this.concentrations, numOfRepeatedTest: this.getNumOfRepeatedTest(signals)}
  }

  private initializeResultMatrix(signals: Signal[][][]) {
    let results = []
    for (let i = 0; i < this.signalsMatrixRows(); i++) {
      if (results[i] == undefined) results[i] = []
      for (let j = 0; j < this.signalsMatrixColumns(); j++) {
        let parsedSignal = this.utilService.parseSignals(signals[i][j])
        if (i == 0) {
          results[i][j] = this.analysisService.getPIDsNoise(parsedSignal.time, parsedSignal.intensities, 
            parsedSignal.PIDNames, constants.SELECT_AREA_WIDTH)
        } else {
          results[i][j] = this.analysisService.getPIDsPerformance(parsedSignal.time, parsedSignal.intensities, 
            parsedSignal.PIDNames, constants.SELECT_AREA_WIDTH)
        }
      }
    }
    return results
  }

  private visualizeDetailTable(testInfo: any, testResult: any[]) : void {
    let items = []
    for (let i = 0; i < testInfo.PIDNames.length; i++) {
      for (let j = 0; j < testInfo.numOfRepeatedTest; j++) {
        /* e.g. PID1在所有浓度下的第四次测试数据 */
        let PIDData = this.getPIDDataByPIDIndexAndTestID(i, j, testResult)
        items.push(this.generateRowForDetailTable(testInfo.PIDNames[i], j + 1, PIDData))
      }
    }
    this.DatailTableDataSource = new MatTableDataSource(items)
    this.populateDisplayedColumns(this.detailTableDisplayedColumns, ['PIDName', 'numOfTest'], testInfo.concentrations)
  }

   /**
    * @param data e.g. PID1在所有浓度下的第四次测试数据
    * @returns 
    */
  private generateRowForDetailTable(PIDName: string, testID: number, PIDData: any[]): any {
   //["mean-std", "mean-t90", "mean-t90"]
    let results = this.stringifyConcentrationDetailsForDetailTable(PIDData)
    return {PIDName: PIDName, numOfTest: testID, results: results}
  }
  
  private visualizeResultTable(testInfo: any, testResult: any[]) : void {
    let items = []
    for (let i = 0; i < testInfo.PIDNames.length; i++) {
      items.push(this.generateRowForResultTable(i, testInfo.PIDNames[i], testInfo.concentrations, testResult))
    } 
    this.ResultTableDataSource = new MatTableDataSource(items)
    this.populateDisplayedColumns(this.resultTableDisplayedColumns, ['PIDName','T90', 'RSquare', 'range', 'mdl', 'sensitivity', 'rsd', 'noise'], testInfo.concentrations)
  }

  private generateRowForResultTable(PIDIndex: number, PIDName: string, concentrations: number[], testResult: any[]): any {
    /*compared to this.results,  each cell of signlePIDResult is one dimensional
     * e.g. PID1在所有浓度下的所有重复测试数据, height is num of concentrations and width is num of repeated test. singlePIDResult[0]表示在第一个浓度下的测试结果 
     * PID1零浓度下的测试数据（两次重复实验） singlePIDResult[0]: [{PIDName:PID1，numOfPoints:150, mean: 20},{PIDName:PID1, numOfPoints:150, mean: 20}]
     * PID1两千浓度下测试数据（两次重复实验） signlePIDResult[1]: [{PIDName:PID1, numOfPoints:150, mean: 30, t90:20}, {PIDName:PID1, numOfPoints:150, mean: 30, t90:20}]
     */
    let PIDData = this.getPIDDataByPIDIndex(PIDIndex, concentrations.length, testResult)
   
    let globalStatistic = this.utilService.getPIDGlobalStatistic(PIDData, concentrations)
    let concentrationDetails = this.stringifyConcentrationDetailsForResultTable(globalStatistic.concentrationDetails)

    /* (last mean - first mean) / first mean*/
    let change = (globalStatistic.concentrationDetails[concentrations.length - 1].mean - globalStatistic.concentrationDetails[0].mean) / globalStatistic.concentrationDetails[0].mean

    return {PIDName: PIDName, t90: this.utilService.formatT90(globalStatistic.globalT90), RSquare: globalStatistic.RSquare, range: 
      this.utilService.keepInt(globalStatistic.range), mdl: this.utilService.keepInt(globalStatistic.globalMDL), 
      sensitivity: this.utilService.formatSensitivity(globalStatistic.globalSensitivity), rsd: this.utilService.formatRSD(globalStatistic.globalRSD), 
      noise: globalStatistic.concentrationDetails[0].mean, concentrationDetails: concentrationDetails}
  }

  private getPIDNames(signals: Signal[][][]): string[] {
    let PIDNames = []
    for (let i = 0; i < signals[0][0].length; i++) {
      PIDNames.push(signals[0][0][i].PIDName)
    } 
    return PIDNames
  }

  private getNumOfRepeatedTest(signals: Signal[][][]): number {
    return signals[0].length
  }

  private populateDisplayedColumns(displayedColumnArray: string[], nonConcentrationColumns: string[], concentrationColumns: number[]): void {
    for (let i = 0; i < nonConcentrationColumns.length; i++) displayedColumnArray.push(nonConcentrationColumns[i])
    for (let i = 0; i < concentrationColumns.length; i++) displayedColumnArray.push("concentration" + (i + 1))
  }

  public onCloseClick() :void {
    this.dialogRef.close()
  }

  private getPIDDataByPIDIndexAndTestID(PIDIndex: number, testID: number, testResult: any[]): any[] {
    return testResult.map(row => row[testID][PIDIndex])
  }

  private getPIDDataByPIDIndex(PIDIndex: number, numOfConcentration: number, testResult: any[]): any[] {
    let PIDData = []
    for (let i = 0; i < numOfConcentration; i++) {
      PIDData.push(testResult[i].map(cell => cell[PIDIndex]))
    }
    return PIDData
  }

  private stringifyConcentrationDetailsForDetailTable(PIDData: any[]) : string[] {
    let numOfConcentration = PIDData.length
    let results = []
    for (let i = 0; i < numOfConcentration; i++) {
      if (i == 0) results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatSTD(PIDData[i].std)].join(constants.SEPERATOR))
      else results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatT90(PIDData[i].T90)].join(constants.SEPERATOR))
    }
    return results
  }

  private stringifyConcentrationDetailsForResultTable(PIDData: any[]): string[] {
    console.log(PIDData)
    let numOfConcentration = PIDData.length
    let results = []
    for (let i = 0; i < numOfConcentration; i++) {
      if (i == 0) results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatSTD(PIDData[i].std), this.utilService.formatDelta(PIDData[i].change)].join(constants.SEPERATOR))
      
      else results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatT90(PIDData[i].T90), this.utilService.keepInt(PIDData[i].MDL), 
      this.utilService.formatRSD(PIDData[i].RSD), this.utilService.formatDelta(PIDData[i].change)].join(constants.SEPERATOR))
    }
    return results
  }
}
