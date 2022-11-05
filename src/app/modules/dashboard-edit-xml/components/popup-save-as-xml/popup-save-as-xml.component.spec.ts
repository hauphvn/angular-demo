import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupSaveAsXmlComponent } from './popup-save-as-xml.component';

describe('PopupSaveAsXmlComponent', () => {
  let component: PopupSaveAsXmlComponent;
  let fixture: ComponentFixture<PopupSaveAsXmlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupSaveAsXmlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupSaveAsXmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
