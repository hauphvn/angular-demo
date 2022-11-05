import { Component, OnInit, Output, EventEmitter, ViewChild, } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/core/services/component-services/dialog.service';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { configsProjectList } from '@app/configs/app-settings.config';
import { SysProjectModel } from '@app/shared/models/systemManagementModel';
import { ProjectmanPopupAddprojectComponent } from '../projectman-popup-addproject/projectman-popup-addproject.component';
import { TableComponent } from '@app/shared/components/table/table.component';
import { messageConstant, ROLE_NEW_TYPE, userPolicies } from '@app/configs/app-constants';
import { HeaderService } from '@app/core/services/component-services/header.service';
import { CheckUserPermission } from '@app/shared/utils/common';

@Component({
  selector: 'app-projectlist',
  templateUrl: './projectlist.component.html',
  styleUrls: ['./projectlist.component.scss']
})
export class ProjectlistComponent implements OnInit {
  @Output() chooseProject = new EventEmitter<any>();
  @ViewChild('projectTable', { static: false }) projectTable: TableComponent;
  constructor(
    public dialog: MatDialog,
    private dialogService: DialogService,
    private spinner: SpinnerService,
    private systemService: SystemManagementService,
    private toastr: ToastrService,
    private headerService: HeaderService,
  ) {
    this.cols = [];
    this.keySearch = '';
    this.data = [];
    this.rowSelectInit = 0;
  }

  cols: any[];
  tableConfig: any;
  keySearch: string;
  data: SysProjectModel[];
  rowSelectInit: number;
  isRoleAdmin = false;
  // isView= false;

  // Roll back
  idProjectFocus: number;

  ngOnInit() {
    this.keySearch = '';
    this.cols = configsProjectList.cols;
    this.tableConfig = JSON.parse(JSON.stringify(configsProjectList.tableConfig));
    delete this.tableConfig.editType;
    this.headerService.userRole.subscribe(data => {
      if (data && data.length > 0) {
        this.isRoleAdmin = CheckUserPermission.userPermission(
          ROLE_NEW_TYPE.ROLE_ADMIN, data
        );
      }
    });
    this.spinner.show();
    this.getListProject(true);
  }

  handleSelectItem(event) {
    if (event && event.id) {
      this.idProjectFocus = event.id;
      this.chooseProject.emit(this.idProjectFocus);
      this.headerService.projectIdActice.next(this.idProjectFocus);
    }
  }

  handleDeleteItem(event) {
    // open confirm dialog
    const params = {
      type: 'confirm',
      message: 'Do you want to delete this project?',
      title: 'CONFIRM'
    };
    this.dialogService.confirm(params).subscribe(res => {
      if (res) {
        const projectDeleteData = {
          project_id: event.rowData.id
        };
        this.spinner.show();
        this.systemService.deleteProject(projectDeleteData).subscribe(
          response => {
            const index = this.data.findIndex(d => d.id === response.id);
            this.data.splice(index, 1);
            this.data = JSON.parse(JSON.stringify(this.data));
            this.spinner.hide();
            this.toastr.success(messageConstant.SYSTEM_MANAGEMENT.DELETE_SUCCESS);
          },
          error => {
            this.spinner.hide();
            this.toastr.error(messageConstant.SYSTEM_MANAGEMENT.DELETE_FAIL);
          }
        );
      }
    });
  }

  handleEditClick(event) {
    this.openPopupAddProjectList(event.rowData);
  }

  openPopupAddProjectList(data: any = null) {
    const dialogRef = this.dialog.open(ProjectmanPopupAddprojectComponent, {
      width: '100%',
      minWidth: '408px',
      maxWidth: '408px',
      disableClose: true,
      data,
      panelClass: 'add-project-dialog-class',
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.spinner.show();
        this.getListProject();
      }
    });
  }

  catchError(err) {
    this.spinner.hide();
    this.toastr.error(err.message || err);
  }

  getListProject(removeFocus: boolean = false) {
    this.systemService.getProjectList().subscribe(
      (res: SysProjectModel[]) => {
        this.data = res;
        if (this.data.length > 0) {
          if (removeFocus) {
            this.idProjectFocus = this.data[0].id;
            this.chooseProject.emit(this.idProjectFocus);
            this.headerService.projectIdActice.next(this.idProjectFocus);
          }
        }
        this.spinner.hide();
      },
      error => {
        this.data = [];
        this.spinner.hide();
        this.toastr.error(error.message);
      }
    );
  }
}
