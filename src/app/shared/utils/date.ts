import { Injectable } from '@angular/core';
import { localTimeZoneByCode } from '@app/configs/app-constants';

@Injectable({ providedIn: 'root' })
export class DateUtil {
  mileStone = new Date(1997, 9, 23, 0, 0, 0);
  getMileStoneDate() {
    return this.mileStone;
  }
  getDateFromTime(hour, minute, second) {
    return new Date(1997, 9, 23, hour, minute, second);
  }

  dateToSeconds(date) {
    if (Object.prototype.toString.call(date) === '[object Date]') {
      // it is a date
      if (!isNaN(date.getTime())) {
        // valid
        return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
      }
    }
    return 0;
  }

  secondsToTime(seconds, fullFormat = false) {
    if (isNaN(seconds) || +seconds < 0) {
      return fullFormat ? '00:00:00:00' : '00:00:00';
    }
    const H = Math.floor(seconds / 3600);
    const M = Math.floor((seconds - 3600 * H) / 60);
    const S = Math.floor(seconds - H * 3600 - M * 60);
    const h = H > 9 ? H : '0' + H;
    const m = M > 9 ? M : '0' + M;
    const s = S > 9 ? S : '0' + S;
    const ms = (parseFloat(seconds).toFixed(2)).slice(-2);
    if (H !== 0 || fullFormat) {
      return `${h}:${m}:${s}.${ms}`;
    }
    return `${m}:${s}.${ms}`;
  }

  secondsToTimeFull(seconds, fullFormat = true) {
    if (isNaN(seconds) || +seconds < 0) {
      return '00:00:00.00';
    }
    const H = Math.floor(seconds / 3600);
    const M = Math.floor((seconds - 3600 * H) / 60);
    const S = Math.floor(seconds - H * 3600 - M * 60);
    const h = H > 9 ? H : '0' + H;
    const m = M > 9 ? M : '0' + M;
    const s = S > 9 ? S : '0' + S;
    const ms = (parseFloat(seconds).toFixed(2)).slice(-2);
    return `${h}:${m}:${s}.${ms}`;
  }

  secondsToDate(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - 3600 * h) / 60);
    const s = seconds - h * 3600 - m * 60;
    return new Date(1997, 9, 23, h, m, s);
  }

  stringTimeToDate(stringTime: string) {
    const listTime = stringTime.split(':');

    return listTime.length === 3
      ? new Date(1997, 9, 23, +listTime[0], +listTime[1], +listTime[2])
      : new Date(1997, 9, 23, 0, +listTime[0], +listTime[1]);
  }

  stringTimeToSeconds(stringTime: string) {
    const listTime = stringTime.split(':');

    return listTime.length === 3
      ? +listTime[0] * 3600 + +listTime[1] * 60 + +listTime[2]
      : +listTime[0] * 60 + +listTime[1];
  }

  stringTimeToMilSeconds(stringTime: string): number {
    let result = 0;
    const timeArray = stringTime.split('.');
    const timeMain = timeArray[0].split(':');
    const milSecond = (timeArray.length === 2) ? parseInt(timeArray[1], 10) : 0;
    result += (timeMain.length === 3)
      ? +(parseInt(timeMain[0], 10) * 3600
       + parseInt(timeMain[1], 10) * 60
      + parseInt(timeMain[2], 10))
      : 0;
    result = parseFloat(String(result + (0.01 * milSecond)));
    return result;
  }

  getRelativeTime(date: Date | string, timeZone: string) {
    const dateTemp = new Date(date);
    if (!isNaN(dateTemp.getTime())) {
      const secondsFromNow =
        (this.convertTimeZone(new Date().toUTCString(), timeZone).getTime() - dateTemp.getTime()) / 1000;

      if (secondsFromNow < 60) {
        // < 1 minute
        return `Under 1 minute`;
      }
      if (secondsFromNow < 60 * 60) {
        // < 1 hour
        const m = Math.floor(secondsFromNow / 60);
        return m === 1 ? `${m} minute ago` : `${m} minutes ago`;
      }
      if (secondsFromNow < 24 * 60 * 60) {
        // < 1 day
        const h = Math.floor(secondsFromNow / (60 * 60));
        return `${h} hours ago`;
      }
      // > 1 day
      const t = Math.floor(secondsFromNow / (24 * 60 * 60));
      return `${t} days ago`;
    }
    return date;
  }

  convertTimeZone(dateString: string, local: string) {
    // dateString: YYYY-mm-dd hh?:mm>:ss?
    dateString = !dateString.includes('Z') ? `${dateString} UTC` : dateString;
    const dateConvert = new Date(dateString).toLocaleString('en-US', { timeZone: localTimeZoneByCode[local] });
    return new Date(dateConvert);
  }

  splitDateToTime(date) {
    let result = '';
    if (date && date.length > 0) {
      const dateSplit = date.split('T');
      if (dateSplit && dateSplit.length > 1) {
        result = dateSplit[1].split('.')[0];
      }
    }
    return result;
  }

}
