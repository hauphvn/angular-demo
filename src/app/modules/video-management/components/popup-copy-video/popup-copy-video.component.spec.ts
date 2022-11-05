import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupCopyVideoComponent } from './popup-copy-video.component';

describe('PopupCopyVideoComponent', () => {
  let component: PopupCopyVideoComponent;
  let fixture: ComponentFixture<PopupCopyVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupCopyVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupCopyVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
