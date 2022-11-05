import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingPreviewComponent } from './reporting-preview.component';

describe('ReportingPreviewComponent', () => {
  let component: ReportingPreviewComponent;
  let fixture: ComponentFixture<ReportingPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportingPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportingPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
