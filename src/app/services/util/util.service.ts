import { Injectable } from '@angular/core';
import { Signal } from 'src/app/interfaces/signal';

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
    return parseFloat((sum / nums.length).toFixed(1))
  }

  public getSTD(mean: number, values: number[]): number {
    let sum = 0
    for (let i = 0; i < values.length; i++) sum += (values[i] - mean) * (values[i] - mean) 
    return parseFloat(Math.sqrt(sum / values.length).toFixed(3))
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
}
