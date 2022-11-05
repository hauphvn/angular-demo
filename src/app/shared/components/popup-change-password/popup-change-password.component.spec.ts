import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupChangePasswordComponent } from './popup-change-password.component';

describe('PopupChangePasswordComponent', () => {
  let component: PopupChangePasswordComponent;
  let fixture: ComponentFixture<PopupChangePasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupChangePasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
