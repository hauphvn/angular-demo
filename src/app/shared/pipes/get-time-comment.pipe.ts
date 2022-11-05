import { Pipe, PipeTransform } from '@angular/core';
import { DateUtil } from '../utils/date';

@Pipe({
  name: 'convertTimeComment'
})
export class GetTimeCommentPipe implements PipeTransform {

  constructor(private dateUtil: DateUtil) {}

  transform(value: any, ...args: any[]): any {
    return this.dateUtil.splitDateToTime(value);
  }
}
