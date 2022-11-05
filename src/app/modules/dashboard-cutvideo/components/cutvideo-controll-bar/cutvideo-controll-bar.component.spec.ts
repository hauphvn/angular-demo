import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CutvideoControllBarComponent } from './cutvideo-controll-bar.component';

describe('ControllBarComponent', () => {
  let component: CutvideoControllBarComponent;
  let fixture: ComponentFixture<CutvideoControllBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CutvideoControllBarComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CutvideoControllBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
