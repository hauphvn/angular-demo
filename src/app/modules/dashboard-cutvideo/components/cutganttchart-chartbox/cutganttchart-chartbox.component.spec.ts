import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CutganttchartChartboxComponent } from './cutganttchart-chartbox.component';

describe('CutganttchartChartboxComponent', () => {
  let component: CutganttchartChartboxComponent;
  let fixture: ComponentFixture<CutganttchartChartboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CutganttchartChartboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CutganttchartChartboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
