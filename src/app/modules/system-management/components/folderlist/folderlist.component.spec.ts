import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderlistComponent } from './folderlist.component';

describe('FolderlistComponent', () => {
  let component: FolderlistComponent;
  let fixture: ComponentFixture<FolderlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FolderlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
