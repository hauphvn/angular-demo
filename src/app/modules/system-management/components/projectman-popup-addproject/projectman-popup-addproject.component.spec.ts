import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectmanPopupAddprojectComponent } from './projectman-popup-addproject.component';

describe('ProjectmanPopupAddprojectComponent', () => {
  let component: ProjectmanPopupAddprojectComponent;
  let fixture: ComponentFixture<ProjectmanPopupAddprojectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectmanPopupAddprojectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectmanPopupAddprojectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
