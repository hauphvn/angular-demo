import { TestBed } from '@angular/core/testing';

import { UploadS3Service } from './upload-s3.service';

describe('UploadS3Service', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UploadS3Service = TestBed.get(UploadS3Service);
    expect(service).toBeTruthy();
  });
});
