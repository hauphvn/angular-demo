import { Observable, from } from 'rxjs';
import { Injectable } from '@angular/core';
import * as S3 from 'aws-sdk/clients/s3';
import { environment } from '@environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UploadS3Service {

  constructor() { }

  upload(file: File, param = {}, s3Config) {
    const contentType = file.type;
    const bucket = new S3(
      {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
        region: s3Config.region
      }
    );
    const params = {
      Bucket: s3Config.Bucket,
      Key: file.name,
      Body: file,
      // ACL: 'public-read',
      ContentType: contentType,
      ContentDisposition: 'attachment'
    };
    const option = Object.assign(params, param);
    return bucket.upload(option);
  }
}
