import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    console.log(this.concentrationNumberArray)
    //console.log(this.concentrations)
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
      let concentration: number =  (this.concentrationForms.controls[i] as any).controls.concentration.value
      //let concentration = controls.controls.concentration.value
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
        concentrations: this.buildConcentrationForm(constants.DEFAULT_NUM_OF_CONCENTRATION, constants.DEFAULT_RANGE),

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
        column: [i==0? 4:5, Validators.required]
      }))
    }
    return formArray
  }

  public pidNumChanged($event) {
    let numOfPid = $event.value
    this.form.controls.pids = this.buildPIDForm(numOfPid)
    this.cleanFilesAndSignals(this.numOfRepeatedTest, this.numOfConcentration)
  }


  private buildConcentrationForm(num: number, range: number): FormArray {
    let formArray: FormArray = new FormArray([])
    let step = num == 1? 0: range / (num - 1)
    for (let i = 0; i< num; i++) {
      formArray.push(this.formBuilder.group({
        concentration: [Math.floor(step * i), Validators.required]
      }))
    }
    return formArray
  }

  public concentrationNumChanged($event) {
    let numOfConcentration = $event.value
    this.form.controls.concentrations = this.buildConcentrationForm(numOfConcentration, this.range)

    this.cleanFilesAndSignals(undefined, numOfConcentration)
  }

  public numOfRepeatedTestChanged($event): void {
    let numOfRepeatedTest = $event.value
    this.cleanFilesAndSignals(numOfRepeatedTest, undefined)
  }

  public rangeChanged($event): void {
    let range = $event.value
    this.cleanFilesAndSignals(undefined, undefined
      )
    if (this.concentrationForms.length == constants.DEFAULT_NUM_OF_CONCENTRATION) {
      this.form.controls.concentrations = this.buildConcentrationForm(constants.DEFAULT_NUM_OF_CONCENTRATION, range)
    }
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
    if (this.check(this.signals)) {
      //let concentrations
      this.dialogService.openFinalResultDialog(this.signals)
    } else {
      this.dialogService.openMsgDialog("文件缺省")
    }
  }

  public fileChangedHandler(fileSignals: Signal[], row: number, column: number) {
    // if change the row or column, will signals dimension auto cahnged?
    if (this.signals[row] == undefined) this.signals[row] = []
    if (this.signals[row][column] == undefined) this.signals[row][column] = []
    this.signals[row][column] = fileSignals
  }

  public check(signals: Signal[][][]): boolean {
    let isValid = true
    try {
      for (let i = 0; i < this.numOfConcentration; i++) {
        for (let j = 0; j < this.numOfRepeatedTest; j++) {
          for (let m = 0; m < this.numOfPID; m++) {
            if (signals[i][j][m] == undefined) isValid = false
          }
        }
      }
    } catch(err) {
      isValid = false
    }
    return isValid
  }
  

  public cleanFilesAndSignals(numOfRepeatedTest: number|undefined, numOfConcentration: number|undefined) :void {
    if (numOfRepeatedTest == undefined) numOfRepeatedTest = this.numOfRepeatedTest
    if (numOfConcentration == undefined) numOfConcentration = this.numOfConcentration
    this.form.controls.files = this.buildFileForm(numOfRepeatedTest, numOfConcentration)
    this.signals = []
  }
}
