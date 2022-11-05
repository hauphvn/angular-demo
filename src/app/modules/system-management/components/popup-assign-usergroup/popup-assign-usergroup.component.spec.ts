import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupAssignUsergroupComponent } from './popup-assign-usergroup.component';

describe('PopupAssignUsergroupComponent', () => {
  let component: PopupAssignUsergroupComponent;
  let fixture: ComponentFixture<PopupAssignUsergroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupAssignUsergroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupAssignUsergroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
