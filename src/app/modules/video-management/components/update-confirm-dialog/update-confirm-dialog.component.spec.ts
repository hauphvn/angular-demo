import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateConfirmDialogComponent } from './update-confirm-dialog.component';

describe('UpdateConfirmDialogComponent', () => {
  let component: UpdateConfirmDialogComponent;
  let fixture: ComponentFixture<UpdateConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
