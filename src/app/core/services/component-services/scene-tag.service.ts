import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SceneTagService {
  public scenes: BehaviorSubject<any>;
  public tags: BehaviorSubject<any>;
  sceneList: string[];
  tagList: string[];
  constructor() {
    this.scenes = new BehaviorSubject<any>({ from: '', newList: [] });
    this.tags = new BehaviorSubject<any>({ from: '', newList: [] });
    this.sceneList = [];
    this.tagList = [];
  }

  addScene(from: string, scene: string, isClickBtnEditXML = false) {
    if (this.sceneList.length >= 1) this.sceneList = [];
    this.sceneList.push(scene.trim());
    if (from != 'gantt')
      this.scenes.next({ from, newList: this.sceneList, isClickBtnEditXML, isRemoveScene: false });
  }

  addTag(from: string, tag: string) {
    this.tagList.push(tag.trim());
    this.tags.next({ from, newList: this.tagList });
  }

  clearScene(from: string, isClickBtnEditXML = false) {
    this.sceneList.length = 0;
    this.scenes.next({ from, newList: this.sceneList, isClickBtnEditXML });
  }

  clearTag(from: string) {
    this.tagList.length = 0;
    this.tags.next({ from, newList: this.tagList });
  }

  removeScene(from: string, scene: string, isClickBtnEditXML = false) {
    const index = this.sceneList.indexOf(scene.toString());
    const isRemoveScene = isClickBtnEditXML;
    if (index !== -1) {
      this.sceneList.splice(index, 1);
      this.scenes.next({ from, newList: this.sceneList, isRemoveScene });
    }
  }

  removeTag(from: string, tag: string) {
    const index = this.tagList.indexOf(tag.trim());
    if (index !== -1) {
      this.tagList.splice(index, 1);
      this.tags.next({ from, newList: this.tagList });
    }
  }
}
