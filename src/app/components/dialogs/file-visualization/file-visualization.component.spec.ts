import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileVisualizationComponent } from './file-visualization.component';

describe('FileVisualizationComponent', () => {
  let component: FileVisualizationComponent;
  let fixture: ComponentFixture<FileVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileVisualizationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
