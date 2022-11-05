import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneTagReportingComponent } from './scene-tag-reporting.component';

describe('SceneTagReportingComponent', () => {
  let component: SceneTagReportingComponent;
  let fixture: ComponentFixture<SceneTagReportingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SceneTagReportingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SceneTagReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
