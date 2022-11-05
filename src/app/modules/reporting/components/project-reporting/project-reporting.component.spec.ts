import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectReportingComponent } from './project-reporting.component';

describe('ProjectReportingComponent', () => {
  let component: ProjectReportingComponent;
  let fixture: ComponentFixture<ProjectReportingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectReportingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
