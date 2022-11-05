import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupValidateExportComponent } from './popup-validate-export.component';

describe('PopupValidateExportComponent', () => {
  let component: PopupValidateExportComponent;
  let fixture: ComponentFixture<PopupValidateExportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupValidateExportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupValidateExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
