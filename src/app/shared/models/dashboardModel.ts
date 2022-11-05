import { ColorUtil } from '../utils/color';

export class TimeSeriesDataModel {
  id: number;
  name: string;
  bufferTime: number;
  data: TimeSeriesLineItemModel[];
  select?: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.title;
    this.bufferTime = data.bufferTime || 0;

    let timeArray: number[] = [];
    let colorArray: string[] = [];

    if (data.times.length) {
      timeArray = data.times.map((time: number) => (time - data.times[0]) / 1000);
    }
    if (data.columns.length) {
      colorArray = ColorUtil.generateColorArray(data.columns.length);
    }
    this.data = data.columns.map(
      (column: any, i: number) => new TimeSeriesLineItemModel(column, timeArray, colorArray[i])
    );
  }
}

export class TimeSeriesLineItemModel {
  name: string;
  color: string;

  data: TimeSeriesPointModel[];

  constructor(data: any, timeArray: number[], color: string) {
    this.name = data.name;
    this.color = color;
    const maxMinInData = [0, 0];

    maxMinInData[0] = Math.min(...data.values);
    maxMinInData[1] = Math.max(...data.values);
    this.data = data.values.map((d: any, i: number) => new TimeSeriesPointModel(d, timeArray[i], maxMinInData));
  }
}

export class TimeSeriesPointModel {
  time: number;
  value: number;
  percent: number;

  constructor(value: number, time: number, maxMinInData: number[]) {
    this.time = time;
    this.value = value;
    if (maxMinInData[1] - maxMinInData[0]) {
      this.percent = ((this.value - maxMinInData[0]) * 100) / (maxMinInData[1] - maxMinInData[0]);
    } else {
      this.percent = 100; // max === min => data is the same
    }
  }
}
