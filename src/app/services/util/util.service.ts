import { Injectable } from '@angular/core';
import { Signal } from 'src/app/interfaces/signal';
import { linear } from 'regression'

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  public getSmallerMinNumberFromArrayOfArray(arrays: number[][]) {
    let min = this.getMinNumber(arrays[0])
    for (let i = 1; i < arrays.length; i++) {
      let tmp = this.getMinNumber(arrays[i])
      min = min < tmp? min : tmp
    }
    return min
  }

  public getMaxNumber(nums: number[]): number {
    return Math.max(...nums)
  }

  public getMinNumber(nums: number[]): number {
    return Math.min(...nums)
  }

  public getMeanNumber(nums: number[]): number {
    let sum = 0
    for (let i = 0; i < nums.length; i++) sum += nums[i]
    return sum / nums.length
  }

  public getSTD(mean: number, values: number[]): number {
    let sum = 0
    for (let i = 0; i < values.length; i++) sum += (values[i] - mean) * (values[i] - mean) 
    return Math.sqrt(sum / values.length)
  }
 
  public deepClone(object: Object): Object {
    return JSON.parse(JSON.stringify(object))
  }

  public parseSignals(signals: Signal[]) : any {
    let time = [], intensities = [], PIDNames = []
    for (let i = 0; i < signals.length; i++) {
      time.push(signals[i].time)
      intensities.push(signals[i].intensity)
      PIDNames.push(signals[i].PIDName)
    }
    return {time: time, intensities: intensities, PIDNames: PIDNames}
  }

  public getRSD(values: number[]) : number {
    let sum = 0, mean = 0
    values.forEach(value => sum += value)
    mean = sum / values.length

    let distanceSquare = 0
    values.forEach(value => distanceSquare += (value - mean) * (value - mean))
    return Math.sqrt(distanceSquare/values.length) / mean
  }

  public linearRegression(concentrations: number[], intensities: number[]): any {
    let points = []
    for (let i = 0; i < concentrations.length; i++) {
      let point = [concentrations[i], intensities[i]]
      points.push(point)
    }
    let result = linear(points, {precision:4})
    return {RSquare: result.r2, slope: result.equation[0], intercept: result.equation[1]}
  }

  public getRange(slope: number, intercept: number): number {
    return (2500 - intercept) / slope
  }

  public getMDLs(intensities: number[], concentrations: number[], noise: number):  number[] {
    let mdls = []
    for (let i = 1; i < intensities.length; i++) {
      let concentrationDiff = concentrations[i] - concentrations[i - 1]
      let intensityDiff = intensities[i] - intensities[i - 1]
      mdls.push(3 * 1000 * noise * concentrationDiff / intensityDiff)
    }
    return mdls
  }

  public getSensitivities(intensities: number[], concentrations: number[]): number[] {
    let sensitivities = []
    for (let i = 1; i < intensities.length; i++) {
      let concentrationDiff = concentrations[i] - concentrations[i - 1]
      let intensityDiff = intensities[i] - intensities[i - 1] 
      sensitivities.push(intensityDiff / concentrationDiff)
    }
    return sensitivities
  }

  /**
   * @param singlePIDResult 2d array, 1th dimension is concentration, 2th dimension is num of test
   * each cell of signlePIDResult is one dimensional
   * e.g. PID1在所有浓度下的所有重复测试数据, height is num of concentrations and width is num of repeated test. 
   * PID1零浓度下的测试数据（两次重复实验） PIDData[0]: [{PIDName:PID1，numOfPoints:150, mean: 20, std: 2},{PIDName:PID1, numOfPoints:150, mean: 20, std:3}]
   * PID1两千浓度下测试数据（两次重复实验） PIDData[1]: [{PIDName:PID1, numOfPoints:150, mean: 30, t90:20}, {PIDName:PID1, numOfPoints:150, mean: 30, t90:20}]
   */
  public getPIDGlobalStatistic(PIDData: any[][], concentrations: number[]): any {
    let intensities = []
    let intensitiesDelta = []
    let STDs = []
    let T90s = []
    let T10s = []
    let RSDs = []
    
    let numOfConcentration = concentrations.length
    let numOfRepeatedTest = PIDData[0].length
    for (let i = 0; i < numOfConcentration; i++) {
      intensities.push(this.getMeanNumber(PIDData[i].map(cell => cell.mean)))
      intensitiesDelta.push((PIDData[i][numOfRepeatedTest - 1].mean - PIDData[i][0].mean) / PIDData[i][0].mean)
      STDs.push(this.getMeanNumber(PIDData[i].map(cell => cell.std)))
      if (i != 0) {
        T90s.push(this.getMeanNumber(PIDData[i].map(cell => cell.T90)))
        T10s.push(this.getMeanNumber(PIDData[i].map(cell => cell.T10)))
        RSDs.push(this.getRSD(PIDData[i].map(cell => cell.mean)))
      }
    }

    let linearModel = this.linearRegression(concentrations, intensities)
    let meanNoise = this.getMeanNumber(PIDData[0].map(cell => cell.std))
    let range = this.getRange(linearModel.slope, linearModel.intercept)
    let mdls = this.getMDLs(intensities, concentrations, meanNoise)
    let sensitivities = this.getSensitivities(intensities, concentrations)
    let concentrationDetails = []
    for (let i = 0; i < numOfConcentration; i++) {
      if (i == 0) concentrationDetails.push({mean: intensities[i], std: STDs[i], change: intensitiesDelta[i]})
      else {
        concentrationDetails.push({mean: intensities[i], T90: T90s[i - 1], T10: T10s[i - 1], MDL: mdls[i- 1], RSD: RSDs[i - 1], change: intensitiesDelta[i]})
      }
    }

    return {globalT90: this.getMeanNumber(T90s), RSquare: linearModel.RSquare, meanNoise: meanNoise, range: range, globalMDL: this.getMaxNumber(mdls), 
      globalSensitivity: this.getMeanNumber(sensitivities), globalRSD: this.getMeanNumber(RSDs), globalChange: this.getMeanNumber(intensitiesDelta.slice(1, numOfConcentration)), concentrationDetails: concentrationDetails}
  }

  public formatSTD(value: number): number {
    return parseFloat(value.toFixed(3))
  }

  public keepInt(value: number): number {
    return parseFloat(value.toFixed(0))
  }

  public formatT90(value: number): number {
    return parseFloat(value.toFixed(1))
  }

  public formatT10(value: number): number {
    return parseFloat(value.toFixed(1))
  }

  public formatRSD(value: number): string {
    return (value * 100).toFixed(2) + "%"
  }
  public formatDelta(value: number): string {
    return (value * 100).toFixed(1) + "%"
  }

  public formatSensitivity(value: number): number {
    return parseFloat(value.toFixed(2))
  }
}
