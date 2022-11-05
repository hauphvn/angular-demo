import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCommentItemComponent } from './dashboard-comment-item.component';

describe('DashboardCommentItemComponent', () => {
  let component: DashboardCommentItemComponent;
  let fixture: ComponentFixture<DashboardCommentItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardCommentItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
