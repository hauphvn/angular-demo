import { HeaderService } from '@app/core/services/component-services/header.service';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-popup-dashboard-setting',
  templateUrl: './popup-dashboard-setting.component.html',
  styleUrls: ['./popup-dashboard-setting.component.scss']
})
export class PopupDashboardSettingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() listXML: any[] = [];
  @Input() listTimeSeries: any[] = [];
  @Input() listXMLSelected: string[] = [];
  @Input() listTimeseriesSelected: string[] = [];

  @Output() saveSetting = new EventEmitter<any>();

  isDisplay: boolean;
  listXMLDragable: any[] = [];

  listTimeseriesDragable: any[] = [];

  startIndex: number;

  xmlSelectedItem: any[] = [];
  timeseriesSelectedItem: any[] = [];

  isXMLGroupFirst = true;

  constructor(
    private headerService: HeaderService) {
  }

  ngOnInit() {
  }

  ngOnChanges() {
  }

  assignList() {
    this.listXMLDragable = this.listXML.filter(xml => this.listXMLSelected.includes(`${xml.id}`));
    this.listTimeseriesDragable = this.listTimeSeries.filter(csv => this.listTimeseriesSelected.includes(`${csv.id}`));
  }

  onDragStart(evt: any, index: any) {
    this.startIndex = index;
  }

  onDropXML(evt, newIdx) {
    const dragItem = this.listXMLDragable[this.startIndex];
    this.listXMLDragable.splice(this.startIndex, 1);
    this.listXMLDragable.splice(newIdx, 0, dragItem);
  }

  onDropTimeseries(evt, newIdx) {
    const dragItem = this.listTimeseriesDragable[this.startIndex];

    this.listTimeseriesDragable.splice(this.startIndex, 1);
    this.listTimeseriesDragable.splice(newIdx, 0, dragItem);
  }

  onOpenDashboardSetting() {
    this.headerService.onOpenDashboardSettingClick();
  }

  onClose() {
    this.isDisplay = false;
    this.removeBlurStyleById('dashboard-section');
    this.removeBlurStyleById('wrap-main-header');
  }

  onSave() {
    this.saveSetting.emit({
      isXMLFirst: this.isXMLGroupFirst,
      listXMLSorted: this.listXMLDragable.map(xml => xml.id.toString()),
      listTimeseriesSorted: this.listTimeseriesDragable.map(csv => csv.id.toString())
    });

    this.isDisplay = false;
    this.removeBlurStyleById('dashboard-section');
    this.removeBlurStyleById('wrap-main-header');
  }

  togglePopup(show: boolean) {
    this.isDisplay = show;
    if (this.isDisplay) {
      this.listXMLDragable = this.listXMLSelected.map(id => this.listXML.find(x => +x.id === +id));
      this.listTimeseriesDragable = this.listTimeseriesSelected.map(id => this.listTimeSeries.find(c => +c.id === +id));
    }
  }

  removeBlurStyleById(id: string) {
    if (document.getElementById(id)) {
      document.getElementById(id).style.cssText =
        `pointer-events: auto;
       filter: none`;
    }
  }
  ngOnDestroy() {
    this.removeBlurStyleById('dashboard-section');
    this.removeBlurStyleById('wrap-main-header');
  }
}
