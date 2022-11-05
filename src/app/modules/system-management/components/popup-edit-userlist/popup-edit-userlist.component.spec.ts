import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupEditUserlistComponent } from './popup-edit-userlist.component';

describe('PopupEditUserlistComponent', () => {
  let component: PopupEditUserlistComponent;
  let fixture: ComponentFixture<PopupEditUserlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupEditUserlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupEditUserlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
