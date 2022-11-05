import { messageConstant } from '@app/configs/app-constants';
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FileExtension } from '@app/configs/app-settings.config';

@Injectable({ providedIn: 'root' })
export class VideoProcessingService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  public promptForFile(fileExtension: string[]): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      // make file input element in memory
      const fileInput: HTMLInputElement = this.document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = fileExtension.join(',');
      fileInput.setAttribute('capture', 'camera');
      // fileInput['capture'] = 'camera';
      fileInput.addEventListener('error', event => {
        reject(event.error);
      });
      fileInput.addEventListener('change', event => {
        const file = fileInput.files[0];
        if (
          fileExtension.filter(x => file.name.toLowerCase().endsWith(x)).length === 0 &&
          fileExtension.join() !== '*.*'
        ) {
          if (fileExtension === FileExtension.VIDEO) {
            reject(`${messageConstant.FILE.VIDEO_EXTENSION_INVALID} ${fileExtension.join(',')}`);
          } else {
            reject(`${messageConstant.FILE.FILE_EXTENSION_INVALID} ${fileExtension.join(',')}`);
          }
        } else if (file.size === 0) {
          reject(messageConstant.FILE.NO_DATA);
        } else {
          resolve(fileInput.files[0]);
        }
      });
      // prompt for video file
      fileInput.click();
    });
  }

  public generateThumbnail(videoFile: Blob): Promise<string> {
    const video: HTMLVideoElement = this.document.createElement('video');
    const canvas: HTMLCanvasElement = this.document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    if (videoFile.type) {
      video.setAttribute('type', videoFile.type);
    }
    video.preload = 'auto';
    video.src = window.URL.createObjectURL(videoFile);
    video.currentTime = 10;
    video.load();
    return new Promise<any>((resolve, reject) => {
      canvas.addEventListener('error', reject);
      video.addEventListener('error', reject);
      video.addEventListener('canplay', event => {
        if (!video.videoHeight || !video.videoWidth) {
          reject(messageConstant.UPLOAD.VIDEO_FORMAT_UNSUPPORTED);
        } else {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve({thumbnail: canvas.toDataURL('image/png'), duration: video.duration});
        }
      });
    });
  }
}
