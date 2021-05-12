import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { constants } from 'src/app/constants/constants';
import { BaselineResult } from 'src/app/interfaces/result/baselineResult/baseline-result';
import { nonBaselineResult } from 'src/app/interfaces/result/nonBaselineResult/nonBaselineResult';
import { Signal } from 'src/app/interfaces/signal';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { UtilService } from 'src/app/services/util/util.service';

@Component({
  selector: 'app-final-result',
  templateUrl: './final-result.component.html',
  styleUrls: ['./final-result.component.scss']
})
export class FinalResultComponent implements OnInit {

  private signals: Signal[][][]
  private results: BaselineResult[][][] | nonBaselineResult[][][] = []

  public concentrations: number[]
  private PIDNames: string[]
  private NumOfRepeatedTest: number

  private matrixRows(): number {
    return this.concentrations.length
  }

  private matrixColumns(): number {
    return this.NumOfRepeatedTest
  }

  public DatailTableDataSource: MatTableDataSource<any>
  public detailTableDisplayedColumns: string[] = ['PIDName', 'numOfTest']

  public ResultTableDataSource: MatTableDataSource<any>
  public resultTableDisplayedColumns: string[] = ['PIDName', 'T90', 'RSquare', 'range', 'mdl', 'sensitivity', 'rsd']

  constructor(@Inject(MAT_DIALOG_DATA) signals: Signal[][][], private analysisService: AnalysisService, private utilService: UtilService) { 
    this.signals = signals
    this.parseSignals(this.signals)
    this.analysis(this.signals)
    this.visualizeDetailTable()
    this.visualizeResultTable()
  }

  private visualizeDetailTable() : void {
    this.populateConcentrationColumns(this.detailTableDisplayedColumns, this.concentrations)
    let items = []
    for (let i = 0; i < this.PIDNames.length; i++) {
      for (let j = 0; j < this.NumOfRepeatedTest; j++) {
        let results = []
        for (let m = 0; m < this.concentrations.length; m++) results.push(this.getResult(m, j, i))
        let item = {PIDName: this.PIDNames[i], numOfTest: j + 1, results: results}
        items.push(item)
      }
    }
    this.DatailTableDataSource = new MatTableDataSource(items)
  }

  private visualizeResultTable() : void {
    this.populateConcentrationColumns(this.resultTableDisplayedColumns, this.concentrations)

  }

  private analysis(signals: Signal[][][]) {
    for (let i = 0; i < this.matrixRows(); i++) {
      if (this.results[i] == undefined) this.results[i] = []
      for (let j = 0; j < this.matrixColumns(); j++) {
        let parsedSignal = this.utilService.parseSignals(signals[i][j])
        if (this.concentrations[i] == 0) {
          this.results[i][j] = this.analysisService.getPIDsNoise(parsedSignal.time, parsedSignal.intensities, 
            parsedSignal.PIDNames, constants.SELECT_AREA_WIDTH)
        } else {
          this.results[i][j] = this.analysisService.getPIDsPerformance(parsedSignal.time, parsedSignal.intensities, 
            parsedSignal.PIDNames, constants.SELECT_AREA_WIDTH)
        }
      }
    }
  }

  private getResult(row: number, column: number, PIDIndex: number): string {
    let result: BaselineResult | nonBaselineResult = this.results[row][column][PIDIndex]
    let isBaselineTest = (this.concentrations[row] == 0)
    if (isBaselineTest) return (result.mean + ";   " + result.std) 
    else {
      let startPointTime = (result as nonBaselineResult).startPointTime
      let responsePointTime = (result as nonBaselineResult).responsePointTime
      let t90 = (result as nonBaselineResult).T90
      return (result.mean + ";  " + result.std + ";   " + startPointTime + ";   " + responsePointTime + ";   " + t90)
    }
  }

  private parseSignals(signals: Signal[][][]): void {
    this.PIDNames = this.getPIDNames(signals)
    this.concentrations = this.getConcentrations(signals)
    this.NumOfRepeatedTest = this.getNumOfRepeatedTest(signals)
  }

  ngOnInit(): void {
  }

  private getPIDNames(signals: Signal[][][]): string[] {
    let PIDNames = []
    for (let i = 0; i < signals[0][0].length; i++) {
      PIDNames.push(signals[0][0][i].PIDName)
    } 
    return PIDNames
  }

  private getConcentrations(signals: Signal[][][]): number[] {
    let concentrations = []
    for (let i = 0; i < signals.length; i++) {
      // 每一行第一列里面的第一个PID浓度
      concentrations.push(signals[i][0][0].concentration)
    }
    return concentrations
  }

  private getNumOfRepeatedTest(signals: Signal[][][]): number {
    return signals[0].length
  }

  private populateConcentrationColumns(columns: string[], concentrations: number[]): void {
    for (let i = 0; i < concentrations.length; i++) columns.push("concentration" + (i + 1))
  }

}
