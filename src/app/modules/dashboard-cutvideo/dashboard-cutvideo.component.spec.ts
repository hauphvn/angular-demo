import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCutvideoComponent } from './dashboard-cutvideo.component';

describe('DashboardCutvideoComponent', () => {
  let component: DashboardCutvideoComponent;
  let fixture: ComponentFixture<DashboardCutvideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardCutvideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardCutvideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
