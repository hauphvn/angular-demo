import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupDocumentComponent } from './popup-document.component';

describe('PopupDocumentComponent', () => {
  let component: PopupDocumentComponent;
  let fixture: ComponentFixture<PopupDocumentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
