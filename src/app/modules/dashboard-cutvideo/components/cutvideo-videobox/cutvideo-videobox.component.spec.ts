import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CutvideoVideoboxComponent } from './cutvideo-videobox.component';

describe('CutvideoVideoboxComponent', () => {
  let component: CutvideoVideoboxComponent;
  let fixture: ComponentFixture<CutvideoVideoboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CutvideoVideoboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CutvideoVideoboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
