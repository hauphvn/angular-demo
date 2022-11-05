import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupVideoDetailComponent } from './popup-video-detail.component';

describe('PopupVideoDetailComponent', () => {
  let component: PopupVideoDetailComponent;
  let fixture: ComponentFixture<PopupVideoDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupVideoDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupVideoDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
