import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { EChartsOption } from 'echarts';
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
  private file: File

  constructor(@Inject(MAT_DIALOG_DATA) data: any, private utilService: UtilService, private analysisService: AnalysisService,
  private dialogRef: MatDialogRef<FileVisualizationComponent>, private dialogService: DialogService) {
    this.signal = data.signals
    this.row = data.row
    this.file = data.file
    this.visualize(this.signal)
  }

  ngOnInit(): void {}

  private visualize(signals: Signal[]): void {
    let results: BaselineResult[] | nonBaselineResult[] = undefined
    try {
      results = this.analysisData(signals)
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
    let xAxis
    if(this.file.type == "application/vnd.ms-excel" || this.file.type =="text/csv") xAxis = {type: 'category', data: time, name: '数据点数'}
    else if (this.file.type == "text/plain") xAxis = {type: 'category', data: time, name: '时间(s)'}
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
      let item = {symbol: "none", name: signals[i].PIDName, data:signals[i].intensity, markPoint: markPoints, type: 'line'}
      series.push(item)
    }
    return series
  }

  private findMarkPointsIndex(result: BaselineResult | nonBaselineResult): number[] {
    let index = result.validArea
    if (this.isNonBaselineResult(result)) {
      index.push((result as nonBaselineResult).startPointIndex)
      index.push((result as nonBaselineResult).responsePointIndex)
      if((result as nonBaselineResult).T10Index != undefined)
      {
        index.push((result as nonBaselineResult).T10Index)
      } 
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

  private analysisData(signals: Signal[]): BaselineResult[] | nonBaselineResult[] {
    let items : BaselineResult[] | nonBaselineResult[] = [] 
    let parsedSignal = this.utilService.parseSignals(signals)
    if (this.row == 1) items = this.analysisService.getPIDsNoise(parsedSignal.time, parsedSignal.intensities, parsedSignal.PIDNames, 150)
    
    else items = this.analysisService.getPIDsPerformance(parsedSignal.time, parsedSignal.intensities, parsedSignal.PIDNames, 150)

    return items
  }

  private visualizeTable(results: BaselineResult[] | nonBaselineResult[]): void {
    /* every signal has the same concentraion */

    if (this.row == 1) this.displayedColumns = ['PIDName', 'numOfPoints', 'mean', 'std']
    else this.displayedColumns = ['PIDName', 'numOfPoints', 'mean', 'std', 'startPointTime', 'responsePointTime', 'T90', 'T10']

    this.dataSource = new MatTableDataSource(results)
  }

  public onCloseClick(): void {
    this.dialogRef.close()
  }
 
}
