export interface GanttModel {
  startDate: Date;
  endDate: Date;
  taskName: string;
  taskNameDisplay: string;
  color: string;
  desciption: string;
}

export interface GanttData {
  name: string;
  data: GanttModel[];
}
