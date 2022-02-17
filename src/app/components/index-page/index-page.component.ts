import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { constants } from 'src/app/constants/constants';
import { Config } from 'src/app/interfaces/config';
import { Signal } from 'src/app/interfaces/signal';
import { DialogService } from 'src/app/services/dialog/dialog.service';

@Component({
  selector: 'app-index-page',
  templateUrl: './index-page.component.html',
  styleUrls: ['./index-page.component.scss']
})
export class IndexPageComponent implements OnInit {

  public form: FormGroup

  public possibleNumOfPID: number[] = constants.POSSIBLE_NUM_OF_PID
  public possibleNumOfConcentration: number[] = constants.POSSIBLE_NUMBER_OF_CONCENTRATION
  public possibleRange: number[] = constants.POSSIBLE_RANGE
  public possibleNumOfRepeatedTest: number[] = constants.POSSIBLE_NUM_OF_REPEATED_TEST

  private signals: Signal[][][] = []

  constructor(public formBuilder: FormBuilder, private dialogService: DialogService) { 
    this.form = this.buildForm()
  }

  ngOnInit(): void {
  }

  get pidsForms(): FormArray {
    return this.form.controls.pids as FormArray
  }

  get concentrationForms(): FormArray {
    return this.form.controls.concentrations as FormArray
  }

  get numOfRepeatedTest(): number {
    return this.form.controls.numOfRepeatedTest.value as number
  }

  get numOfConcentration(): number {
    return this.form.controls.numOfConcentration.value as number
  }

  get concentrationNumberArray(): number[] {
    let concentrations = []
    for (let i = 0; i < this.concentrationForms.controls.length; i++) {
      let concentration: number = parseFloat((this.concentrationForms.controls[i] as any).controls.concentration.value)
      concentrations.push(concentration)
    }
    return concentrations
  }

  get numOfPID(): number {
    return this.form.controls.numOfPID.value as number
  }

  get range(): number {
    return this.form.controls.range.value as number
  }

  get fileBlockWidth(): number {
    return (1 / this.numOfRepeatedTest) * 90
  }

  get fileBlockHeight(): number {
    return (1 / this.concentrationForms.length) * 90
  }

  get files(): FormArray {
    return this.form.controls.files as FormArray
  }


  private buildForm(): FormGroup {
    return this.formBuilder.group({
        numOfPID: [constants.DEFAULT_NUM_OF_PID, Validators.required],
        pids: this.buildPIDForm(constants.DEFAULT_NUM_OF_PID),

        numOfConcentration: [constants.DEFAULT_NUM_OF_CONCENTRATION, Validators.required],
        concentrations: this.buildConcentrationForm(constants.DEFAULT_NUM_OF_CONCENTRATION),

        range: [constants.DEFAULT_RANGE, Validators.required],
        numOfRepeatedTest: [constants.DEFAULT_REPEATED_TEST, Validators.required],
        files: this.buildFileForm(constants.DEFAULT_REPEATED_TEST, constants.DEFAULT_NUM_OF_CONCENTRATION)
      });
  }

  private buildPIDForm(num: number): FormArray {
    let formArray: FormArray = new FormArray([])
    for (let i = 0; i < num; i++) {
      formArray.push(this.formBuilder.group({
        PIDName: ['PID' + (i + 1), Validators.required],
        column: [i + 2, Validators.required]
      }))
    }
    return formArray
  }

  public pidNumChanged($event) {
    let numOfPid = $event.value
    this.form.controls.pids = this.buildPIDForm(numOfPid)
    this.cleanFilesAndSignals(this.numOfRepeatedTest, this.numOfConcentration)
  }


  private buildConcentrationForm(num: Number): FormArray {
    let formArray: FormArray = new FormArray([])
    for (let i = 0; i< num; i++) {
      formArray.push(this.formBuilder.group({
        concentration: [0, Validators.required]
      }))
    }
    return formArray
  }

  public concentrationNumChanged($event) {
    let numOfConcentration = $event.value
    this.form.controls.concentrations = this.buildConcentrationForm(numOfConcentration)

    this.cleanFilesAndSignals(undefined, numOfConcentration)
  }

  public numOfRepeatedTestChanged($event): void {
    let numOfRepeatedTest = $event.value
    this.cleanFilesAndSignals(numOfRepeatedTest, undefined)
  }

  public rangeChanged($event): void {
    this.cleanFilesAndSignals(undefined, undefined)
  }

  private buildFileForm(numOfRepeatedTest: number, numOfConcentration: number): FormArray {
    let files: FormArray = new FormArray([])
    for (let i= 0; i < numOfConcentration; i++) {
      let subFiles : FormArray = new FormArray([])

      for (let j = 0; j < numOfRepeatedTest; j++) {
        let form = this.formBuilder.group({
          fileName: ['', Validators.required]
        })
        subFiles.push(form)
      }

      files.push(subFiles)
    }
    return files
  }

  public buildTestConfig(): Config[] {
    let configs : Config[] = []
    this.pidsForms.controls.forEach(control => {
      let config = control.value as Config
      configs.push(config)
    })
    return configs
  }

  public analysis() {
    try {
      this.detectInputError(this.signals, this.concentrationNumberArray)
      this.dialogService.openFinalResultDialog(this.signals, this.concentrationNumberArray)  
    } catch (err) {
      console.log(err)
      this.dialogService.openMsgDialog(err.message)
    }
  }

  public fileChangedHandler(fileSignals: Signal[], row: number, column: number) {
    // if change the row or column, will signals dimension auto cahnged?
    if (this.signals[row] == undefined) this.signals[row] = []
    if (this.signals[row][column] == undefined) this.signals[row][column] = []
    this.signals[row][column] = fileSignals
  }

  public detectInputError(signals: Signal[][][], concentrations: number[]): void {
    for (let i = 0; i < this.numOfConcentration; i++) {
      for (let j = 0; j < this.numOfRepeatedTest; j++) {
        for (let m = 0; m < this.numOfPID; m++) {
          if (signals[i] == undefined || signals[i][j] == undefined || signals[i][j][m] == undefined) throw new Error("文件缺省")
        }
      }
    }
    if (concentrations[0] != 0) throw new Error("第一个浓度值必须为零")

    for (let i = 1; i < concentrations.length; i++) {
      if (concentrations[i] == 0 || isNaN(concentrations[i])) throw new Error("浓度值填写错误")
    }   
  }
  

  public cleanFilesAndSignals(numOfRepeatedTest: number|undefined, numOfConcentration: number|undefined) :void {
    if (numOfRepeatedTest == undefined) numOfRepeatedTest = this.numOfRepeatedTest
    if (numOfConcentration == undefined) numOfConcentration = this.numOfConcentration
    this.form.controls.files = this.buildFileForm(numOfRepeatedTest, numOfConcentration)
    this.signals = []
  }
}
