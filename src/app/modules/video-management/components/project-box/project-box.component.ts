import { Component, OnInit, Input } from '@angular/core';
import { ProjectModel } from '@app/shared/models/videoManagementModel';

@Component({
  selector: 'app-project-box',
  templateUrl: './project-box.component.html',
  styleUrls: ['./project-box.component.scss']
})
export class ProjectBoxComponent implements OnInit {
  @Input() project: ProjectModel;
  @Input() projectId: number;
  constructor() {}

  ngOnInit() {}
}
