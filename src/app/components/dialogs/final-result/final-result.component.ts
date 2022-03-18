import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  private testInfo: any

  public detailTableHeader : string[] = []
  public resultTableHeader: string[] = []

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
    private dialogService: DialogService, private dialogRef: MatDialogRef<FinalResultComponent>, private sanitizer: DomSanitizer) { 
    this.signals = data.signals
    this.concentrations = data.concentrations
  }

  ngOnInit(): void {
    try {
      this.testResults = this.initializeResultMatrix(this.signals)

      /* {PIDNames: [PID1, PID2], concentrations: [0, 50, 100], numOfRepeatedTest: 2} */
      this.testInfo = {PIDNames: this.getPIDNames(this.signals), concentrations: this.concentrations, numOfRepeatedTest: this.getNumOfRepeatedTest(this.signals)}

      this.visualizeDetailTable(this.testInfo, this.testResults)
      this.visualizeResultTable(this.testInfo, this.testResults)
    } catch(err) {
      console.log(err)
      let msg = err.msg == undefined? "未知错误":err.msg
      this.dialogService.openMsgDialog(msg)
    }
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

        //  {PIDName: PID1, numOfTest: 1, results: ["mean-std", "mean-t90", "mean-t90"]}
        items.push(this.generateRowForDetailTable(testInfo.PIDNames[i], j + 1, PIDData))
      }
    }
    this.DatailTableDataSource = new MatTableDataSource(items)

    // "PIDName", "numOfTest", "concentration1", "concentration2"
    this.detailTableDisplayedColumns = this.generateDetailTableColumn(testInfo)

     // "PID名称", "重复测试次数", "0ppm (均值 / 标准差) ", "50ppm (均值 / T90) "
    this.detailTableHeader = this.generateDetailTableHeader(testInfo)
  }

  private generateRowForDetailTable(PIDName: string, testID: number, PIDData: any[]): any {
    let numOfConcentration = PIDData.length
    let results = []
    for (let i = 0; i < numOfConcentration; i++) {
      if (i == 0) results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatSTD(PIDData[i].std)].join(constants.SEPERATOR))
      else results.push([this.utilService.keepInt(PIDData[i].mean), this.utilService.formatT90(PIDData[i].T90), this.utilService.formatT10(PIDData[i].T10)].join(constants.SEPERATOR))
    }
    results

    // {PIDName: PID1, numOfTest: 1, results: ["mean-std", "mean-t90", "mean-t90"]}
    return {PIDName: PIDName, numOfTest: testID, results: results}
  }
  
  private visualizeResultTable(testInfo: any, testResult: any[]) : void {
    let items = []
    for (let i = 0; i < testInfo.PIDNames.length; i++) {
      items.push(this.generateRowForResultTable(i, testInfo.PIDNames[i], testInfo.concentrations, testResult))
    } 
    this.ResultTableDataSource = new MatTableDataSource(items)
    this.resultTableDisplayedColumns = this.generateResultTableColumn(testInfo)
    this.resultTableHeader = this.generateResultTableHeader(testInfo)
  }

  private generateDetailTableColumn(testInfo: any) : string[] {
    // "PIDName", "numOfTest", "concentration1", "concentration2"
    return this.populateDisplayedColumns(['PIDName', 'numOfTest'], testInfo.concentrations)
  }

  private generateDetailTableHeader(testInfo: any): string[] {
     // "PIDName", "numOfTest", "concentration1", "concentration2"
     let column = this.generateDetailTableColumn(testInfo)

     for (let i = 0; i < column.length; i++) {
       if (i == 0) column[i] = "PID名称"
       else if (i == 1) column[i] = "重复测试次数"
       else if (i == 2) column[i] = this.concentrations[i - 2] + 'ppm' + "(均值 / 标准差)"
       else if (i == 3) column[i] = this.concentrations[i - 2] + 'ppm' + "(均值 / T90 / T10)"
       else column[i] = this.concentrations[i - 2] + 'ppm'
     }
     return column
  }

  private generateResultTableColumn(testInfo: any): string[] {
    return  this.populateDisplayedColumns(['PIDName','T90', 'RSquare', 'range', 'mdl', 'sensitivity', 'rsd', 'change','noise'], testInfo.concentrations)
  }

  private generateResultTableHeader(testInfo: any): string[] {
    let column = this.generateResultTableColumn(testInfo)
    for (let i = 0; i < column.length; i++) {
      if (i == 0) column[i] = "PID名称"
      else if (i == 1) column[i] = "Avg T90(s)"
      else if (i == 2) column[i] = "R^2"
      else if (i == 3) column[i] = "上限(ppm)"
      else if (i == 4) column[i] = "下限(ppb)"
      else if (i == 5) column[i] = "灵敏度(mV/ppm)"
      else if (i == 6) column[i] = "Avg RSD"
      else if (i == 7) column[i] = "Avg 改变"
      else if (i == 8) column[i] = "噪声(mV)"
      else if (i == 9) column[i] = this.concentrations[i - 9] + 'ppm' + "(均值 / 标准差 / 改变)"
      else if (i == 10) column[i] = this.concentrations[i - 9] + 'ppm' + "(均值 / T90 / T10 / 下限 / RSD / 改变)"
      else column[i] = this.concentrations[i - 9] + 'ppm'
    }
    return column
  }

  private generateRowForResultTable(PIDIndex: number, PIDName: string, concentrations: number[], testResult: any[]): any {
    /*compared to this.results,  each cell of PIDData is one dimensional
     * e.g. PID1在所有浓度下的所有重复测试数据, height is num of concentrations and width is num of repeated test. PIDData[0]表示在第一个浓度下的测试结果 
     * PID1零浓度下的测试数据（两次重复实验） PIDData[0]: [{PIDName:PID1，numOfPoints:150, mean: 20},{PIDName:PID1, numOfPoints:150, mean: 20}]
     * PID1两千浓度下测试数据（两次重复实验） PIDData[1]: [{PIDName:PID1, numOfPoints:150, mean: 30, t90:20}, {PIDName:PID1, numOfPoints:150, mean: 30, t90:20}]
     */
    let PIDData = this.getPIDDataByPIDIndex(PIDIndex, concentrations.length, testResult)
   
    let globalStatistic = this.utilService.getPIDGlobalStatistic(PIDData, concentrations)

    let concentrationDetails = globalStatistic.concentrationDetails

    let numOfConcentration = concentrationDetails.length
    let results = []
    for (let i = 0; i < numOfConcentration; i++) {
      if (i == 0) results.push([this.utilService.keepInt(concentrationDetails[i].mean), this.utilService.formatSTD(concentrationDetails[i].std), this.utilService.formatDelta(concentrationDetails[i].change)].join(constants.SEPERATOR))
      
      else results.push([this.utilService.keepInt(concentrationDetails[i].mean), this.utilService.formatT90(concentrationDetails[i].T90), this.utilService.formatT10(concentrationDetails[i].T10), this.utilService.keepInt(concentrationDetails[i].MDL), 
      this.utilService.formatRSD(concentrationDetails[i].RSD), this.utilService.formatDelta(concentrationDetails[i].change)].join(constants.SEPERATOR))
    }    

    return {PIDName: PIDName, t90: this.utilService.formatT90(globalStatistic.globalT90), RSquare: globalStatistic.RSquare, range: 
      this.utilService.keepInt(globalStatistic.range), mdl: this.utilService.keepInt(globalStatistic.globalMDL), 
      sensitivity: this.utilService.formatSensitivity(globalStatistic.globalSensitivity), rsd: this.utilService.formatRSD(globalStatistic.globalRSD), 
      change: this.utilService.formatDelta(globalStatistic.globalChange), noise: this.utilService.formatSTD(globalStatistic.concentrationDetails[0].std), concentrationDetails: results}
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

  private populateDisplayedColumns(nonConcentrationColumns: string[], concentrationColumns: number[]): string[] {
    let displayedColumnArray = []
    for (let i = 0; i < nonConcentrationColumns.length; i++) displayedColumnArray.push(nonConcentrationColumns[i])
    for (let i = 0; i < concentrationColumns.length; i++) displayedColumnArray.push("concentration" + (i + 1))
    return displayedColumnArray
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

  public onDownloadClick() : void {
    const a = document.createElement('a');
    document.body.appendChild(a);
    let detaileTableContent = this.stringifyDetailTable(this.testInfo, this.testResults)
    let resultTableContent = this.stringifyResultTable(this.testInfo, this.testResults)
    let fileContent = [detaileTableContent, '', resultTableContent].join('\n')

    const blob = new Blob([fileContent], { type: 'application/vnd.ms-excel' }),
    url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = this.testInfo.PIDNames.join('_')  + '_result.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private stringifyDetailTable(testInfo: any, testResult: any[]): string {
    let rows = [this.detailTableHeader.join(',')]

    for (let i = 0; i < testInfo.PIDNames.length; i++) {
      for (let j = 0; j < testInfo.numOfRepeatedTest; j++) {
        let PIDData = this.getPIDDataByPIDIndexAndTestID(i, j, testResult)

        let rowData = this.generateRowForDetailTable(testInfo.PIDNames[i], j + 1, PIDData)

        let row = [rowData.PIDName, rowData.numOfTest].concat(rowData.results).join(',')
        rows.push(row)
      }
    }
    return rows.join('\n')
  }

  private stringifyResultTable(testInfo: any, testResult: any[]): string {
    let rows = [this.resultTableHeader.join(',')]
    
    for (let i = 0; i < testInfo.PIDNames.length; i++) {
     let rowData = this.generateRowForResultTable(i, testInfo.PIDNames[i], testInfo.concentrations, testResult)
     let row = [rowData.PIDName, rowData.t90, rowData.RSquare, rowData.range, rowData.mdl, rowData.sensitivity, rowData.rsd, 
      rowData.change, rowData.noise].concat(rowData.concentrationDetails).join(',')

      rows.push(row)
    }
    
    return rows.join('\n')
  }

  public onCloseClick() :void {
    this.dialogRef.close()
  }
}
