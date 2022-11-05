import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IFrameDashboardComponent } from './dashboard-iframe.component';

describe('IFrameDashboardComponent', () => {
  let component: IFrameDashboardComponent;
  let fixture: ComponentFixture<IFrameDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IFrameDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IFrameDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
