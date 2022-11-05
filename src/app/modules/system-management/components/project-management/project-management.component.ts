import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-project-management',
  templateUrl: './project-management.component.html',
  styleUrls: ['./project-management.component.scss']
})
export class ProjectManagementComponent implements OnInit {
  constructor() {}
  projectId: any;

  ngOnInit() {}

  handleChooseProject(projectId) {
    this.projectId = projectId;
  }
}
