import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupUserGroupComponent } from './popup-user-group.component';

describe('PopupUserGroupComponent', () => {
  let component: PopupUserGroupComponent;
  let fixture: ComponentFixture<PopupUserGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupUserGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupUserGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
