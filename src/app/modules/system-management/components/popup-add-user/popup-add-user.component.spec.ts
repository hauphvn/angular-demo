import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupAddUserComponent } from './popup-add-user.component';

describe('PopupAddUserComponent', () => {
  let component: PopupAddUserComponent;
  let fixture: ComponentFixture<PopupAddUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupAddUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupAddUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
