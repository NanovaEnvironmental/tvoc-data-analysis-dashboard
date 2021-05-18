import { Injectable } from '@angular/core';
import { BaselineResult } from 'src/app/interfaces/result/baselineResult/baseline-result';
import { nonBaselineResult } from 'src/app/interfaces/result/nonBaselineResult/nonBaselineResult';
import { UtilService } from '../util/util.service';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  constructor(private utilService: UtilService) { }

/*---------------------------Helper Method For Analysis a Single File--------------------------------------------------------- */
  private getValidArea(intensity: number[], windSize: number): number[] {
      let endPointIndex = this.getEndPointIndex(intensity)
      if (endPointIndex - windSize + 1 < 0) throw new Error("定位到结束点, 但是无法获取有效计算区域")
      let validAreaIndex = []
      for (let i = 0; i < windSize; i++) validAreaIndex.push(endPointIndex - windSize + i + 1)
      return validAreaIndex
  }

  private getValidAreaForBaselineTest(length: number, windSize: number) {
      let area = []
      for (let i = windSize - 1; i >= 0; i--) area.push(length - 1 - i);
      return area
  }

  private getEndPointIndex(intensity: number[]): number|undefined {
    let endPointIndex = undefined
    for (let i = Math.floor(intensity.length / 2); i < intensity.length - 5; i++) {
      let pointAfter = intensity.slice(i, i + 5)
      if (this.decreaseWithThres(pointAfter, 1)) {
        endPointIndex = i
        break
      }
    }
    if (endPointIndex != undefined) return endPointIndex
    else throw new Error("无法定位结束点")
  }

  private decreaseWithThres(values: number[], thres: number) {
    for (let i = 0; i < values.length - 1; i++) {
      let diff = values[i] - values[i + 1]
      if (diff < thres) return false
    }
    return true
  }

  private getStartPointIndex(intensity: number[]): number|undefined {
    let startPointIndex = undefined

    for (let i = 0; i < intensity.length - 2; i++) {
      if (intensity[i + 2] - intensity[i] > 5) {
        startPointIndex = i
        break
      }
    }

    if (startPointIndex != undefined) return startPointIndex
    else throw new Error("无法定位开始点")
  }

  private getResponsePointIndex(intensity: number[], startPointIndex: number, avgIntensity: number): number | undefined {
    let startPointIntensity = intensity[startPointIndex]
    let thres = ((avgIntensity - startPointIntensity) * 0.9) + startPointIntensity
    for (let i = 0; i < intensity.length; i++) {
      if (intensity[i] >= thres && intensity[i] <= avgIntensity) return i
    }
    return undefined
  }

  private getT90(startPointIndex: number, responsePointIndex: number, time: number[]): number {
    let startPointTime = time[startPointIndex]
    let responsePointTime = time[responsePointIndex]
    return parseFloat((responsePointTime - startPointTime).toFixed(1))
  }
 
  private getPIDPerformance(time: number[], intensity: number[], PIDName: string, windSize: number): nonBaselineResult {
      let startPointIndex = this.getStartPointIndex(intensity)
      let validArea = this.getValidArea(intensity, windSize)
      let avgIntensity = parseFloat(this.utilService.getMeanNumber(intensity.slice(validArea[0], validArea[validArea.length - 1] + 1)).toFixed(0))
      let responsePointIndex = this.getResponsePointIndex(intensity, startPointIndex, avgIntensity)
      let T90 = this.getT90(startPointIndex, responsePointIndex, time)
      let std = this.utilService.getSTD(avgIntensity, intensity.slice(validArea[0], validArea[validArea.length - 1] + 1))
      let result = { PIDName: PIDName, numOfPoints: validArea.length, mean: avgIntensity, std: std, startPointIndex: startPointIndex, 
        startPointTime: time[startPointIndex], responsePointTime: time[responsePointIndex], responsePointIndex: responsePointIndex, T90: T90, validArea: validArea}
      return result
  }

  private getPIDNoise(time: number[], intensity: number[], PIDName: string, windSize: number): BaselineResult {
    let validArea = this.getValidAreaForBaselineTest(time.length, windSize)
    let avgIntensity = parseFloat(this.utilService.getMeanNumber(intensity.slice(validArea[0], validArea[validArea.length - 1] + 1)).toFixed(0))
    let std = this.utilService.getSTD(avgIntensity, intensity.slice(validArea[0], validArea[validArea.length - 1] + 1))

    let result = {PIDName: PIDName, numOfPoints: validArea.length, mean: avgIntensity, std: std, validArea: validArea}
    return result
  }

  public getPIDsPerformance(times: number[][], intensities: number[][], PIDNames: string[], windSize: number): nonBaselineResult[] {
    let results: nonBaselineResult[] = []
    for (let i = 0; i < times.length; i++) {
      let result = this.getPIDPerformance(times[i], intensities[i], PIDNames[i], windSize)
      results.push(result)
    }
    return results
  }

  public getPIDsNoise(times: number[][], intensities: number[][], PIDNames: string[], windSize: number): BaselineResult[]{
    let results: BaselineResult[] = []
    for (let i = 0; i < times.length; i++) {
      let result = this.getPIDNoise(times[i], intensities[i], PIDNames[i] ,windSize)
      results.push(result)
    }
    return results
  }
 
  

}
