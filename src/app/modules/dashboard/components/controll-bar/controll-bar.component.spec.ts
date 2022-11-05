import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllBarComponent } from './controll-bar.component';

describe('ControllBarComponent', () => {
  let component: ControllBarComponent;
  let fixture: ComponentFixture<ControllBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ControllBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
