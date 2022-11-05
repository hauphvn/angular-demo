import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardVideoComponent } from './dashboard-video.component';

describe('DashboardVideoComponent', () => {
  let component: DashboardVideoComponent;
  let fixture: ComponentFixture<DashboardVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
