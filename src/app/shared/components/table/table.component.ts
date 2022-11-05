import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ViewChildren,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnChanges {
  @ViewChild('dt', { static: false }) tableSearch;
  @Input() data: any[];
  @Input() tableConfig;
  @Input() cols: any[];
  @Input() isShowBtnEdit: boolean;
  @Input() isShowBtnDelete: boolean;
  @Input() keySearch: string;
  @Input() rowSelectInit = 0;
  @Input() countPagination: number;

  @Output() dataChange = new EventEmitter<any>();
  @Output() saveEdit = new EventEmitter<any>();
  @Output() download = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() selectedItem = new EventEmitter<any>();
  @Output() editClick = new EventEmitter<any>();

  isInline = false;
  constructor(private tableMessge: ToastrService) {}

  cloneDataRow: any[];
  selectItem: any;
  // scrollableCols: any[];
  autoSelect: boolean;

  // test scroll
  // frozenCols = [
  //   { field: 'name', header: 'Name' },
  //   { field: '', header: '' }
  // ];
  // scrollableCols = [
  //   { field: 'creater', header: 'Creater' },
  //   { field: 'createDate', header: 'Create Date' },
  //   { field: 'comment', header: 'Comment' }
  // ];

  ngOnInit() {
    this.cloneDataRow = [];
    // if (this.tableConfig.vScroll) {
    //   this.scrollableCols = [...this.data].splice(this.cols[this.tableConfig.vScroll.frozenIndex], 1);
    // }
  }

  ngOnChanges(change: SimpleChanges) {
    if (change.keySearch && change.keySearch.currentValue !== change.keySearch.previousValue) {
      if (this.tableSearch) {
        this.tableSearch.filterGlobal(this.keySearch, 'contains');
      }
    }

    if (change.tableConfig) {
      this.autoSelect = this.tableConfig.selection;
    }

    if (change.rowSelectInit) {
      this.autoSelect = true;
    }
  }

  handleOnPageChange(event) {}

  onRowEditInit(rowData, rowIndex) {
    this.isInline = this.tableConfig.editType === 'inline';
    this.cloneDataRow[rowIndex] = { ...rowData };
    this.editClick.emit({ rowData, rowIndex });
  }

  onRowEditSave(rowData, rowIndex) {
    this.dataChange.emit(this.data); // 2-way data binding
    this.saveEdit.emit({ rowData, rowIndex });
  }

  onRowEditCancel(rowData, rowIndex) {
    this.data[rowIndex] = this.cloneDataRow[rowIndex];
    this.cloneDataRow[rowData.brand] = {};
  }

  onDelete(rowData, rowIndex) {
    // this.data = this.data.filter((val, i) => i !== rowIndex);
    // this.cloneDataRow[rowIndex] = {};
    // this.dataChange.emit(this.data);
    this.delete.emit({ rowData, rowIndex });
  }

  changeSearch(event) {
    // Search all when clear input
    if (event.target.value.length === 0) {
      this.tableSearch.filterGlobal('', 'contains');
    }
  }

  onRowSelect(event) {
    this.selectedItem.emit(event.data);
    this.autoSelect = false;
  }

  makeClass(value: string, field: string) {
    if (this.tableConfig.rowConfigs[field].type === 'dropdown') {
      switch (value) {
        case 'NONE':
          return 'bg-dropdown bg-none';
        case 'VIEWER':
          return 'bg-dropdown bg-viewer';
        case 'EDITOR':
          return 'bg-dropdown bg-editor';
        case 'ALL':
          return 'bg-dropdown bg-all';
      }
    }
  }

  cancelEditAll() {
    document.querySelectorAll('button[pcanceleditablerow]').forEach(item => (item as HTMLElement).click());
  }
}
