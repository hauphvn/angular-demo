import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupExportComponent } from './popup-export.component';

describe('PopupExportComponent', () => {
  let component: PopupExportComponent;
  let fixture: ComponentFixture<PopupExportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupExportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
