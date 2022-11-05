import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CutlinechartChartboxComponent } from './cutlinechart-chartbox.component';

describe('CutlinechartChartboxComponent', () => {
  let component: CutlinechartChartboxComponent;
  let fixture: ComponentFixture<CutlinechartChartboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CutlinechartChartboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CutlinechartChartboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
