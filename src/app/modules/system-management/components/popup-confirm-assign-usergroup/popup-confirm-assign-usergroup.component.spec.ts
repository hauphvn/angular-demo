import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupConfirmAssignUsergroupComponent } from './popup-confirm-assign-usergroup.component';

describe('PopupConfirmAssignUsergroupComponent', () => {
  let component: PopupConfirmAssignUsergroupComponent;
  let fixture: ComponentFixture<PopupConfirmAssignUsergroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupConfirmAssignUsergroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupConfirmAssignUsergroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
