import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { constants } from 'src/app/constants/constants';
import { Config } from 'src/app/interfaces/config';
import { Signal } from 'src/app/interfaces/signal';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { UtilService } from 'src/app/services/util/util.service';

@Component({
  selector: 'app-upload-file-page',
  templateUrl: './upload-file-page.component.html',
  styleUrls: ['./upload-file-page.component.scss']
})
export class UploadFilePageComponent implements OnInit {

  @Input('testConfig') configs: Config[]
  @Input('row') row: number
  @Input('numOfTest') numOfTest: number
  @Output() fileChanged: EventEmitter<Signal[]> = new EventEmitter()

  public signals: Signal[]
  public file: File;

  constructor(private dialogService: DialogService, private utilService: UtilService) { }

  ngOnInit(): void {
  }

  /* open dialog if file is invalid(number of lines too smaller or column is not digital) */
  public async onFileEvent(files: File[]): Promise<void> {
    try {
      let file = files[0]
      let signals = await this.tryToParseAndValidateFile(file)
      console.log(signals)
      this.file = file
      this.signals = signals
      this.fileChanged.emit(signals)
      } catch (err) {
        this.dialogService.openMsgDialog(err.message)
      }
  }

  deleteFile() {
    this.file = undefined
    for (let i = 0;  i < this.signals.length; i++) this.signals[i] = undefined
    this.fileChanged.emit(this.signals)
  }

  public async tryToParseAndValidateFile(file: File): Promise<Signal[]> {
    let signals: Signal[] = []
    let PIDNum = this.configs.length
    let content = await file.text()
    for (let i = 0; i < PIDNum; i++) {
      let name = this.configs[i].PIDName
      let intensity = this.tryToReadColumnFromFile(this.configs[i].column, content)
      if (intensity.length < constants.SELECT_AREA_WIDTH) throw new Error("文件行数小于设定阈值：" + constants.SELECT_AREA_WIDTH)
      let time = this.tryToReadColumnFromFile(2, content)
      let signal = {'PIDName': name, 'intensity': this.formatIntensity(intensity), 'time': this.formatTime(time), 'numOfTest': this.numOfTest}
      signals.push(signal)
    }
    return signals
  }

  private tryToReadColumnFromFile(column: number, content: string): number[] {
      let result: number[] = []
      let lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length != 0) {
          let tokens = lines[i].split(",")
          let value = Number.parseFloat(tokens[column - 1].split(":")[1])
          if (isNaN(value)) throw new Error("文件格式错误，请检查PID列数是否正确")
          else result.push(value)
        }
        else console.log("invalid line: " + lines[i])
      }
      return result
  }

  public async viewFile() : Promise<void> {
    console.log(this.signals)
    this.dialogService.openFileVisualizationDialog(this.signals, this.row)
  }

  /* time[i] = time[i] - time[0] */
  private formatTime(time: number[]): number[] {
    let formattedTime = []
    for (let i = 0; i < time.length; i++) {
      formattedTime.push(parseFloat(((time[i] - time[0]) / 1000).toFixed(1)))
    }
    return formattedTime
  }

  private formatIntensity(intensity: number[]): number[] {
    let formattedIntensity = []
    for (let i = 0; i < intensity.length; i++) {
      formattedIntensity.push(parseFloat(intensity[i].toFixed(2)))
    }
    return formattedIntensity
  }

}
