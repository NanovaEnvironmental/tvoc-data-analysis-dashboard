import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IndexPageComponent } from './components/index-page/index-page.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { MaterialModule } from './material/material.module';
import { UploadFilePageComponent } from './components/upload-file-page/upload-file-page.component';
import { DndDirective } from './directive/dnd.directive';
import { FileVisualizationComponent } from './components/dialogs/file-visualization/file-visualization.component';
import { PopupComponent } from './components/dialogs/popup/popup.component';
import { FinalResultComponent } from './components/dialogs/final-result/final-result.component';

@NgModule({
  declarations: [
    AppComponent,
    IndexPageComponent,
    UploadFilePageComponent,
    DndDirective,
    FileVisualizationComponent,
    PopupComponent,
    FinalResultComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
  }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
