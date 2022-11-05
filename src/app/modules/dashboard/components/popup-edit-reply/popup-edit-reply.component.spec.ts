import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEditReplyComponent } from './popup-edit-reply.component';

describe('PopupEditReplyComponent', () => {
  let component: PopupEditReplyComponent;
  let fixture: ComponentFixture<PopupEditReplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupEditReplyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupEditReplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
