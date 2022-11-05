import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupAddFolderComponent } from './popup-add-folder.component';

describe('PopupAddFolderComponent', () => {
  let component: PopupAddFolderComponent;
  let fixture: ComponentFixture<PopupAddFolderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupAddFolderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupAddFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
