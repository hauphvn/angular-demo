import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupDashboardSettingComponent } from './popup-dashboard-setting.component';

describe('PopupDashboardSettingComponent', () => {
  let component: PopupDashboardSettingComponent;
  let fixture: ComponentFixture<PopupDashboardSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupDashboardSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupDashboardSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
