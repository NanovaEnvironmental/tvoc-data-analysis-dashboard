import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { EChartsOption } from 'echarts';
import { constants } from 'src/app/constants/constants';
import { BaselineResult } from 'src/app/interfaces/result/baselineResult/baseline-result';
import { nonBaselineResult } from 'src/app/interfaces/result/nonBaselineResult/nonBaselineResult';
import { Signal } from 'src/app/interfaces/signal';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { UtilService } from 'src/app/services/util/util.service';

@Component({
  selector: 'app-file-visualization',
  templateUrl: './file-visualization.component.html',
  styleUrls: ['./file-visualization.component.scss']
})
export class FileVisualizationComponent implements OnInit {


  public chartOption: EChartsOption
  public dataSource: MatTableDataSource<nonBaselineResult|BaselineResult>
  public displayedColumns: string[] = ['PIDName', 'numOfPoints', 'mean', 'std', 'startPointTime', 'responsePointTime', 'T90']
  private signal: Signal[]
  private row: number
  private windSizeArr: number[] = []
  public PIDNames: string[] = []

  constructor(@Inject(MAT_DIALOG_DATA) data: any, private utilService: UtilService, private analysisService: AnalysisService,
  private dialogRef: MatDialogRef<FileVisualizationComponent>, private dialogService: DialogService) {
    this.signal = data.signals
    this.row = data.row
    this.windSizeArr = data.windSizeArr
    this.signal.forEach(item => this.PIDNames.push(item.PIDName))
    this.visualize(this.signal)
    dialogRef.beforeClosed().subscribe(() => dialogRef.close(this.windSizeArr))
  }

  ngOnInit(): void {}

  private visualize(signals: Signal[]): void {
    let results: BaselineResult[] | nonBaselineResult[] = undefined
    try {
      // If the window size has already been set for all values, use the updated size
      results = this.getDataAnalysis(signals)

      this.visualizeTable(results)
    } catch (err) {
      this.dialogService.openMsgDialog(err)
    } finally {
      this.visualizeChart(signals, results)
    }
  }

  private visualizeChart(signals: Signal[], results: BaselineResult[] | nonBaselineResult[]): void {
    let time = signals[0].time
    this.chartOption = {
      legend: {data: signals.map(signal => signal.PIDName)},
      xAxis: this.buildChartXAxisSetting(time),
      yAxis: this.buildYAxisSetting(signals),
      series: this.buildSeries(signals, results)
    }
  }

  private buildChartXAxisSetting(time: number[]): any{
    let xAxis = {type: 'category', data: time, name: '时间(s)'}
    return xAxis
  }

  private buildYAxisSetting(signals: Signal[]): any {
    let intensities = []
    for (let i = 0; i < signals.length; i++) intensities.push(signals[i].intensity)
    let minValue = this.utilService.getSmallerMinNumberFromArrayOfArray(intensities)
    let yAxis = {type: 'value', name: '信号强度(mV)', min: minValue}
    return yAxis
  }

  private buildSeries(signals: Signal[], results: BaselineResult[] | nonBaselineResult[]): any {
    let series = []
    for (let i = 0; i < signals.length; i++) {
      let markPoints = results == undefined? undefined: this.buildMarkPoints(signals[i].time, signals[i].intensity, this.findMarkPointsIndex(results[i]))
      this.setWindowSizeArray(results[i], i)
      let item = {symbol: "none", name: signals[i].PIDName, data:signals[i].intensity, markPoint: markPoints, type: 'line'}
      series.push(item)
    }
    return series
  }

  private setWindowSizeArray(result: BaselineResult | nonBaselineResult, i: number): void {
    let index = result.validArea
    let offset = this.row == 1? 1 : 3
    this.windSizeArr[2*i] = index[0]/10
    this.windSizeArr[2*i + 1] = index[index.length - offset]/10
  }

  private getDataAnalysis(signals: Signal[]): BaselineResult[] | nonBaselineResult[] {
    // If Window Array is not full, use default window size
    // If Window Array is full, use updated window size
    let windowSize = (this.windSizeArr.length != 2*signals.length) ? constants.SELECT_AREA_WIDTH : this.windSizeArr
    
    let items : BaselineResult[] | nonBaselineResult[] = [] 
    let parsedSignal = this.utilService.parseSignals(signals)
    if (this.row == 1) items = this.analysisService.getPIDsNoise(parsedSignal.time, parsedSignal.intensities, parsedSignal.PIDNames, windowSize)
    
    else items = this.analysisService.getPIDsPerformance(parsedSignal.time, parsedSignal.intensities, parsedSignal.PIDNames, windowSize)

    return items
  }

  private findMarkPointsIndex(result: BaselineResult | nonBaselineResult): number[] {
    let index = result.validArea
    if (this.isNonBaselineResult(result)) {
      index.push((result as nonBaselineResult).startPointIndex)
      index.push((result as nonBaselineResult).responsePointIndex)
    }
    return index
  }

  private buildMarkPoints(time: number[], intensity: number[], markPointIndexs: number[]): any {
    let markPoints = []
    for (let i = 0; i < markPointIndexs.length; i++) {
      let markPoint = { xAxis: time[markPointIndexs[i]].toString(), yAxis: intensity[markPointIndexs[i]].toString() }
      markPoints.push(markPoint)
    }
    return { symbol:"number", symbolSize: 5, data: markPoints, itemStyle: {color: 'red'} }
  }

  private isNonBaselineResult(result: any) {
    return result.startPointIndex != undefined && result.responsePointIndex != undefined && result.T90 != undefined
  }

  private visualizeTable(results: BaselineResult[] | nonBaselineResult[]): void {
    /* every signal has the same concentraion */

    if (this.row == 1) this.displayedColumns = ['PIDName', 'numOfPoints', 'mean', 'std']
    else this.displayedColumns = ['PIDName', 'numOfPoints', 'mean', 'std', 'startPointTime', 'responsePointTime', 'T90']

    this.dataSource = new MatTableDataSource(results)
  }

  public onCloseClick(): void {
    this.dialogRef.close()
  }

  /* Below functions used to update the UI with an updated visualization of the dataset using the range given by the user */

  public PointChanged(target, targetValue: number, index: number):void {
    let targetPairNumber: number = this.getTargetPairNumber(index)
    if(targetValue != NaN){
      // The first value is the start point for the PID and the second is the end point.
      let targetFirstValue: number = this.windSizeArr[targetPairNumber]// Start Point
      let targetSecondValue: number = targetValue// End Point
      if (index%2 == 0) {
        targetFirstValue = targetValue// Start Point
        targetSecondValue = this.windSizeArr[targetPairNumber]// End Point
      }
      // Reset values to previous valid entry if current entry not valid
      if (!this.areTargetValuesValid(targetFirstValue, targetSecondValue)) {
        target.value = this.windSizeArr[index]// Overrides user input string on screen
        targetValue = this.windSizeArr[index]// Updates number used in calculation
      }
      // Updates Window Size Array with a valid entry
      this.windSizeArr[index] = targetValue
      // Update Results, then update table and chart with updated results
      let result: BaselineResult[] | nonBaselineResult[] = this.getDataAnalysis(this.signal)
      this.visualizeTable(result)
      this.visualizeChart(this.signal, result)
    }
  }

  // Each PID has its own Start and End. This finds the end index from giving it the start and the start index from giving it the end
  private getTargetPairNumber(i: number): number {
    let numberPair: number = i - 1
    if (i%2 == 0) numberPair = i + 1
    return numberPair
  }

  private areTargetValuesValid(startValue: number, endValue: number): boolean {
    // General bounds checking, both values are < max and > min
    if (startValue > (this.signal[0].time.length - 1)/10 || startValue < 0 || endValue > (this.signal[0].time.length - 1)/10 || endValue < 0) {
      return false
    }
    // If the first value is greater than the second value, values are invalid
    if (startValue > endValue) return false
    return true
  }
 
}
