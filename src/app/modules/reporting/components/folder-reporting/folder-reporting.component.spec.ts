import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderReportingComponent } from './folder-reporting.component';

describe('FolderReportingComponent', () => {
  let component: FolderReportingComponent;
  let fixture: ComponentFixture<FolderReportingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FolderReportingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
