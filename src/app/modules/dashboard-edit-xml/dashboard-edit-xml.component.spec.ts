import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEditXmlComponent } from './dashboard-edit-xml.component';

describe('DashboardScalingSceneComponent', () => {
  let component: DashboardEditXmlComponent;
  let fixture: ComponentFixture<DashboardEditXmlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardEditXmlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardEditXmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
