import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { SpinnerService } from '@app/core/services/component-services/spinner.service';
import { SystemManagementService } from '@app/core/services/server-services/system-management.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CustomValidator } from '@app/shared/validators/custom-validator';
import { messageConstant } from '@app/configs/app-constants';
import { UploadS3Service } from '@app/core/services/cloud-services/upload-s3.service';

@Component({
  selector: 'app-projectman-popup-addproject',
  templateUrl: './projectman-popup-addproject.component.html',
  styleUrls: ['./projectman-popup-addproject.component.scss']
})
export class ProjectmanPopupAddprojectComponent implements OnInit {
  addProjectForm: FormGroup;
  thumbnailUrl: any;
  thumbnailFile: any;

  awsConfig: any;
  projectBucket: string;

  popupTitle: string;
  projectImageChange: boolean;
  updateType: boolean;
  constructor(
    private spinnerService: SpinnerService,
    private sysManagementService: SystemManagementService,
    private s3Service: UploadS3Service,
    private toastrService: ToastrService,
    public dialogRef: MatDialogRef<ProjectmanPopupAddprojectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.initVariable();
    this.initForm();
  }

  initVariable() {
    this.projectImageChange = false;
    if (!!this.data) {
      // Update type
      this.popupTitle = 'UPDATE PROJECT';
      this.updateType = true;
      this.thumbnailUrl = this.data.thumbnail;
      this.projectBucket = this.data.bucket;
    } else {
      // Normal type
      this.popupTitle = 'ADD PROJECT';
      this.updateType = false;
    }
  }

  initForm() {
    // Init form object and validate
    this.addProjectForm = this.data
      ? new FormGroup({
          name: new FormControl(this.data.name, [
            CustomValidator.maxLength(200),
            CustomValidator.required,
            CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.SPECIAL_CHARACTER)
          ]),
          comment: new FormControl(this.data.comment, [CustomValidator.maxLength(200)])
        })
      : new FormGroup({
          name: new FormControl('', [
            CustomValidator.maxLength(200),
            CustomValidator.required,
            CustomValidator.checkSpecialCharacter(messageConstant.USER_MANAGEMENT.SPECIAL_CHARACTER)
          ]),
          comment: new FormControl('', [CustomValidator.maxLength(200)])
        });
  }

  get formData() {
    return this.addProjectForm.controls;
  }

  get disableSaveButton() {
    const { name, comment } = this.formData;
    if (this.updateType) {
      return (!name.dirty && !comment.dirty && !this.projectImageChange) || this.addProjectForm.invalid;
    }
    return this.formData.name.value.length === 0 || this.addProjectForm.invalid;
  }

  onSaveClick() {
    if (this.addProjectForm.valid) {
      this.spinnerService.show();
      const { name, comment } = this.formData;
      if (!this.updateType) {
        this.saveProjectOnNormalType(name.value, comment.value);
      } else {
        this.saveProjectOnUpdateType(name.value, comment.value);
      }
    }
  }

  makeS3Config(projectBucket: string, awsConfig: any) {
    return {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
      Bucket: `${awsConfig.Bucket}/${projectBucket}`
    };
  }

  // save project to db
  saveProject(projectInfoToSave: any) {
    this.spinnerService.show();

    this.sysManagementService.addProject(projectInfoToSave).subscribe(
      res => {
        this.spinnerService.hide();
        this.toastrService.success(messageConstant.SYSTEM_MANAGEMENT.PROJECT_LIST_ADD_SUCCESS);
        this.dialogRef.close(true);
      },
      error => {
        this.spinnerService.hide();
        if (error.status && error.status === 400) {
          this.toastrService.error(messageConstant.SYSTEM_MANAGEMENT.PROJECT_LIST_ADD_SAME_NAME_ERR);
        }
      }
    );
  }

  updateProject(projectInfoToUpdate: any) {
    this.spinnerService.show();

    this.sysManagementService.updateProject(projectInfoToUpdate).subscribe(
      res => {
        this.spinnerService.hide();
        this.toastrService.success(messageConstant.SYSTEM_MANAGEMENT.UPDATE_SUCCESS);
        this.dialogRef.close(true);
      },
      error => {
        this.spinnerService.hide();
        if (error.status && error.status === 400) {
          this.toastrService.error(messageConstant.SYSTEM_MANAGEMENT.UPDATE_FAIL);
        }
      }
    );
  }

  // save and update project with thumbnail change
  saveProjectOnNormalType(name: string, comment: string) {
    this.sysManagementService.getProjectBucket(name, this.updateType).subscribe(
      config => {
        // get project bucket
        let projectInfoToSave: any;
        if (!this.updateType) {
          // Add type
          this.projectBucket = config.bucket;
          projectInfoToSave = {
            name,
            description: comment,
            thumbnail: '',
            bucket: this.projectBucket
          };
        } else {
          // update type
          projectInfoToSave = {
            project_id: this.data.id,
            name,
            description: comment,
            thumbnail: ''
          };
        }
        this.awsConfig = JSON.parse(config.key);
        if (this.thumbnailFile && this.thumbnailUrl) {
          // have thumbnail
          const s3Config = this.makeS3Config(this.projectBucket, this.awsConfig);
          // upload thumbnail & save project to db
          this.uploadThumbnailAndSaveProject(s3Config, projectInfoToSave);
        } else {
          // save/update project to db
          if (this.updateType) {
            this.updateProject(projectInfoToSave);
          } else {
            this.saveProject(projectInfoToSave);
          }
        }
      },
      error => {
        this.spinnerService.hide();
      }
    );
  }

  saveProjectOnUpdateType(name: string, comment: string) {
    if (this.projectImageChange && this.thumbnailUrl) {
      // Remove/Reup and Upload new thumbnail

      // Reuse bucket created at project creation
      // Reuse function to update Project
      this.saveProjectOnNormalType(name, comment);
    } else {
      // Only update name and comment
      // No need to get project bucket
      const projectInfoToSave = {
        project_id: this.data.id,
        name,
        description: comment,
        thumbnail: this.thumbnailUrl
      };
      this.updateProject(projectInfoToSave);
    }
  }

  uploadThumbnailAndSaveProject(s3Config: any, projectInfo: any) {
    this.s3Service
      .upload(this.thumbnailFile, {}, s3Config)
      .promise()
      .then(response => {
        projectInfo.thumbnail = response.Location;
        if (!this.updateType) {
          this.saveProject(projectInfo);
        } else {
          this.updateProject(projectInfo);
        }
      })
      .catch(err => {
        this.spinnerService.hide();
      });
  }

  handleChooseThumbnailClick(thumbnailInput: any) {
    thumbnailInput.click();
  }

  handleRemoveThumbnailClick(thumbnailInput: any) {
    this.projectImageChange = true;
    this.thumbnailFile = undefined;
    this.thumbnailUrl = '';
    thumbnailInput.value = '';
  }

  handleFileChange(event: any) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.thumbnailUrl = reader.result as string;
        this.thumbnailFile = file;
        this.projectImageChange = true;
      };
    }
  }
}
