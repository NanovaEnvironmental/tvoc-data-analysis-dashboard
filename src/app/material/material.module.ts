import { NgModule } from '@angular/core';

import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule  } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatDialogModule} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

const modules = [
  MatCardModule,
  MatInputModule,
  MatButtonModule,
  MatToolbarModule,
  MatIconModule,
  MatTableModule,
  MatRadioModule,
  MatSelectModule,
  MatSortModule,
  MatFormFieldModule,
  ReactiveFormsModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatDialogModule,
  MatTooltipModule,
  MatAutocompleteModule,
]

@NgModule({
  declarations: [],
  imports: modules,
  exports: modules,
})

export class MaterialModule { }
