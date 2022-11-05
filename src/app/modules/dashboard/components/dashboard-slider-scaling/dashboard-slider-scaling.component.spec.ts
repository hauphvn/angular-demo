import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSliderScalingComponent } from './dashboard-slider-scaling.component';

describe('DashboardSliderScalingComponent', () => {
  let component: DashboardSliderScalingComponent;
  let fixture: ComponentFixture<DashboardSliderScalingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardSliderScalingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardSliderScalingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
