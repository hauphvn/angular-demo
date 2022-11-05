import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDecorateSceneComponent } from './edit-decorate-scene.component';

describe('EditDecorateSceneComponent', () => {
  let component: EditDecorateSceneComponent;
  let fixture: ComponentFixture<EditDecorateSceneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditDecorateSceneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDecorateSceneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
