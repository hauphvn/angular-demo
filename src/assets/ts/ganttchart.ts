import * as d3 from 'd3';
import { chartReplacePair, stringPattern, ZOOM_OPTIONS } from '@app/configs/app-constants';

import { DateUtil } from '@app/shared/utils/date';
import { BehaviorSubject } from 'rxjs';
import { EditingSceneBar, SceneBar, SceneBarScaling } from '@app/shared/models/editXMLDataModel';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';

export class Gantt {
  count = 0;
  dataUtil = new DateUtil();
  containerWidth: any;
  containerHeight: any;
  rectClickCallback: any;
  dragCallback;
  dragEndCallback;
  dragStartCallback;
  endSceneCallback;
  barClickCallback;
  sceneClickCallback;
  barContextMenuCallback;
  resizeCallback;
  mileStoneDate;
  endMileStoneDate;
  selector = 'body';

  timeRange = 90; // Max range time viewable in primary chart (seconds) Default 1m30s
  widthDragRect;
  maxWidthDragRect;

  timeDomainStart;
  timeDomainEnd;
  timeDomainMiddle;
  timeDomainSubStart;
  timeDomainSubEnd;

  numTypeOfXML: any[];

  tasks;
  taskTypes;
  taskStatus = [];

  xAxis: any;
  yAxis: any;

  dragOffsetPerPixel;
  isSliding = false;
  widthBar = 20;

  // Check is just a bar of filter a scene/tag acitved
  previousActiveStateOfFilter = false;
  listSceneActive = [];
  listTagActive = [];
  tagsInScene = {};
  speed = 1;

  startTimeToMiddleTimeRange = 0;

  regExp: RegExp;

  // Scaling time, new scene xml
  sceneBarScaling: SceneBarScaling = new SceneBarScaling(-1, 0, 0);
  sceneNameAddNewFromLeftSide = '';
  isEditXML = false;
  isClickedLeftRect = false;
  isClickedRightRect = false;
  isPlaying = false;
  objEditingSceneBar: EditingSceneBar = new EditingSceneBar();
  currentTimeSceneBarIsChosen = 0;
  isAddNewSceneBar = false;
  leftRectSBGanttChart: any;
  rightRectSBGanttChart: any;
  scalingLeftRightObjList = [];
  observableNumberCurrentTimeChoosing: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  observableScalingLeftRightObjList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  obsSceneBarScaling: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  // End scaling time, new scene xml

  sizeZoomMapping: {
    timeRange: any;
    startTimeToMiddleTimeRange: any;
  };

  constructor(
    w, h, idArea, rectClickCallback = null,
    private videoChartService: VideoChartService) {
    this.containerWidth = w;
    this.containerHeight = h;
    this.selector = idArea;
    this.rectClickCallback = rectClickCallback;
    this.regExp = new RegExp(stringPattern, 'g');
    this.barSelected = {};
    this.startTimeToMiddleTimeRange = this.timeRange / 2;

  }

  margin = {
    top: 25,
    right: 1,
    bottom: 5,
    left: 120
  };

  height: any;
  width: any;
  widthSub: any;
  heightSub: any;
  tickFormat = '%M:%S';

  x: any;
  y: any;

  // For multy select and click behavior
  sceneFiltered: any[];
  tagFiltered: any[];

  // Tooltip
  tooltip;

  // BrushResize
  brushResize;
  startResizeTrigger = false;
  newScaleNameSize = this.margin.left;

  // Comment
  listComment: any[];
  mapCommentScene: any[];
  barSelected: any;

  endBarCallbackId: any;

  svg: any;
  lastActiveSceneIndex: number;

  kZoom = 1;

  reduceNumType(no) {
    if (!this.numTypeOfXML || !this.numTypeOfXML[0])
      return;
    let sum = this.numTypeOfXML[0].length;

    if (no > 0) {
      for (let i = 1; i <= no; ++i) {
        sum += this.numTypeOfXML[i].length;
      }
    }
    return sum;
  }

  keyFunction(d: any) {
    return d.startDate + d.taskName + d.endDate;
  }

  activeBarClass(d: any, i: number) {
    let classString = `${d.taskName.replace(/ +/g, '-')} _${d.taskNameDisplay.replace(/ +/g, '-')} bar-opacity bar`;
    if (d.startDate <= this.timeDomainMiddle && d.endDate >= this.timeDomainMiddle) {
      classString += ' bar-active';
      if (this.listSceneActive.indexOf(d.taskNameDisplay.trim()) !== -1) {
        this.listSceneActive.push(d.taskNameDisplay.trim());
        this.lastActiveSceneIndex = i;
      }
      if (d.description.length) {
        this.pushDescriptionsToListTagActive(d.description);
      }
    }
    if (d.description.length) {
      this.initTagsInScene(d.description, d.taskNameDisplay);
    }
    return classString;
  }

  toggleActiveBarClass(d: any, i: number) {
    if (this.barSelected && this.barSelected.id === `bar-${i}`) {
      if (this.barSelected.endDate - this.timeDomainMiddle <= 1 && this.barSelected.endDate >= this.timeDomainMiddle) {
        if (this.endSceneCallback) {
          clearTimeout(this.endBarCallbackId);
          this.endBarCallbackId = setTimeout(() => {
            this.endSceneCallback(true, this.barSelected, 0);
            return false;
          }, ((this.barSelected.endDate - this.timeDomainMiddle) * 1000 + 1000) / this.speed);
        }
      }
    }
    if (
      d.endDate - this.timeDomainMiddle <= 1 &&
      d.endDate >= this.timeDomainMiddle &&
      this.isFiltered(d.taskNameDisplay)
    ) {
      if (this.endSceneCallback) {
        clearTimeout(this.endBarCallbackId);
        this.endBarCallbackId = setTimeout(() => {
          this.endSceneCallback(false, {}, d.endDate);
        }, ((d.endDate - this.timeDomainMiddle) * 1000) / this.speed);
      }
    }
    if (d.startDate <= this.timeDomainMiddle && d.endDate >= this.timeDomainMiddle) {
      if (this.listSceneActive.indexOf(d.taskNameDisplay) === -1) {
        this.listSceneActive.push(d.taskNameDisplay.trim());
        this.lastActiveSceneIndex = i;
      }
      return true;
    }
    setTimeout(() => false, ((d.endDate - this.timeDomainMiddle) * 1000) / this.speed);
  }

  makeLabelString(stringName: string) {
    // A Character take about 12px
    const maxLabelLength = Math.floor((this.margin.left - 45) / 12); // num of character + '...'
    if (stringName && stringName.length > maxLabelLength) {
      return stringName.slice(0, maxLabelLength - 1) + '...';
    }
    return stringName;
  }

  initTimeDomain(targetTime, clickOrDrag = false, isDragDivision = false) {
    this.timeDomainStart = !this.timeDomainStart ? 0 : this.timeDomainStart;
    if (this.isSliding && !clickOrDrag) {
      this.timeDomainStart = this.mileStoneDate + targetTime;
    }
    this.timeDomainStart = d3.min([this.timeDomainStart, this.endMileStoneDate]);
    if (this.barSelected.endDate && this.timeDomainStart - this.barSelected.endDate >= +1000) {
      this.timeDomainStart = this.barSelected.startDate;
    }
    if (this.sizeZoomMapping) {
      this.timeDomainMiddle = this.timeDomainStart;
      this.timeDomainStart = this.timeDomainStart - this.sizeZoomMapping.startTimeToMiddleTimeRange[this.kZoom];
      this.timeDomainEnd = this.timeDomainStart + this.sizeZoomMapping.timeRange[this.kZoom];
    }
  }

  initAxis() {
    if (this.taskTypes) {
      this.x = d3
        .scaleLinear()
        .domain([this.timeDomainStart, this.timeDomainEnd])
        .range([0, this.width - this.margin.right - this.margin.left])
        .clamp(false);

      this.y = d3
        .scaleBand()
        .domain(this.taskTypes.taskName)
        .rangeRound([10, this.height - this.margin.top - this.margin.bottom])
        .padding(0.06);

      this.xAxis = d3
        .axisTop(this.x)
        .ticks(8)
        .tickFormat((tick: string) => this.makeXTickFormat(tick))
        .tickSize(5)
        .tickPadding(4);

      this.yAxis = d3
        .axisLeft(this.y)
        .tickSize(0)
        .tickFormat((d, i) => {
          return this.makeLabelString(this.taskTypes.taskNameDisplay[i]);
        });
      this.dragOffsetPerPixel =
        this.sizeZoomMapping.timeRange[this.kZoom] / (this.width - this.margin.right - this.margin.left);
    }

  }

  makeXTickFormat(tickValue: string) {
    return this.dataUtil.secondsToTime(+tickValue);
  }

  makeFillArea() {
    const sum = this.reduceNumType(this.numTypeOfXML.length - 1);
    const startY = 0;
    const endY = sum * (this.widthBar + 1) + 14;
    return { startY, endY };
  }

  makeFillDivisionArea(no) {
    const sum = this.reduceNumType(no) - 1; // num of rows
    const startY = 12 + sum * (this.widthBar + 1); // start at the end
    return `translate(${-this.margin.left}, ${startY})`;
  }

  makeTextNameArea(no, numLine) {

    const sum = this.reduceNumType(no); // num of rows
    const startY = numLine <= 1 ? 5 : 12 + (sum - this.numTypeOfXML[no].length) * (this.widthBar + 1);
    const height = numLine <= 1 ? 13 : (numLine - 1) * (this.widthBar + 1);
    return `M${-this.margin.left},${startY + (this.widthBar + 1) / 2} h25  a5,5 0 0 1 5,5 v${height -
      10} a5,5 0 0 1 -5,5 h-25 a0,0 0 0 1 0,0 v-${height - 10 - (this.widthBar + 1) / 2} a0,0 0 0 1 0,0 z`;
  }

  makeXMLNameString(item: any) {
    if (!!item && item.length) {
      const maxLenght = (item.length - 2) * (this.widthBar + 1); // in pixel
      const maxCharacter = maxLenght / this.textSize('A');
      if (item.name.length > maxCharacter && maxCharacter > 3) {
        return item.name.slice(0, maxCharacter - 3) + '...';
      }
      else if (item.name.length <= maxCharacter)
        return item.name;
      else if (item.length > 1)
        return '.';
      else
        return '';
      return item.name;
    } else {
      return '...';
    }
  }

  makePathGrid(no) {
    const y = (no + 1) * (this.widthBar + 1) + 13;
    const endX = this.width - this.margin.left - this.margin.right;

    return `M ${-this.margin.left + 35} ${y} L ${endX} ${y}`;
  }

  makeSignTextTransform(no) {
    const sum = this.reduceNumType(no);
    const startY = 14 + (sum - this.numTypeOfXML[no].length) * (this.widthBar + 1);
    const endY = 5 + (sum - 1) * (this.widthBar + 1);
    const startX = -this.margin.left + 20;
    const y = this.numTypeOfXML[no].length > 1 ? (startY + endY) / 2 : (startY + endY);
    return `translate(${startX}, ${y}) rotate(-90)`;
  }

  textSize(text) {
    if (!d3) {
      return;
    }
    const container = d3.select('body').append('svg');
    container
      .append('text')
      .text(text)
      .attr({ x: -99999, y: -99999 });
    const size = container.node().getBBox();
    container.remove();
    return size.width;
  }

  build(tasks: any[], isDragDivision?: boolean, widthGanntChart?: number) {
    let numTypeOfXmlValid = false;
    for (var i = 0; i <= this.numTypeOfXML.length - 1; i++) {
      if (this.numTypeOfXML[i].length > 1) {
        numTypeOfXmlValid = true;
        break;
      }
    }
    if (!numTypeOfXmlValid) return;
    this.tasks = tasks;
    this.sceneFiltered = [];
    this.tagFiltered = [];
    this.listSceneActive = [];
    this.listTagActive = [];
    this.tagsInScene = {};
    this.height = (this.widthBar + 1) * this.taskTypes.taskName.length + 45;
    this.width = widthGanntChart || this.containerWidth;
    const mileSD = this.mileStoneDate; // minimum date
    const endMileSD = this.endMileStoneDate; // maximum date
    this.createSizeZoomMapping();
    this.initTimeDomain(0);
    this.initAxis();

    const xaxisArea = d3
      .select('#gantt-xaxix')
      .append('svg')
      .attr('class', 'xaxis')
      .attr('width', this.width)
      .attr('height', 20)
      .append('g')
      .attr('class', 'xaxis-area')
      .attr('height', 20)
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.svg = d3
      .select(this.selector)
      .append('svg')
      .attr('class', 'chart')
      .attr('width', this.width)
      .attr('height', this.height - 18 - 12 - 12)
      .append('g')
      .attr('class', 'gantt-chart')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', `translate(${this.margin.left}, -12)`);

    // rects
    const rects = this.svg
      .selectAll('.chart')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('class', this.activeBarClass.bind(this))
      .attr('id', (d, i) => `bar-${i}`)
      .attr('y', 0)
      .attr('transform', d => {
        return `translate(${this.x(d.startDate)}, ${this.y(d.taskName)})`;
      })
      .attr('height', d => {
        return this.y.bandwidth();
      })
      .attr('width', d => {
        return Math.max(0, this.x(d.endDate) - this.x(d.startDate));
      })
      .style('fill', d => {
        return d.color;
      });

    // rects click
    rects.on('click', this.handleBarClick.bind(this));
    if (!this.isEditXML)
      rects.on('contextmenu', this.handleBarContextMenuClick.bind(this));

    // rects comment
    this.drawComment();

    this.svg
      .selectAll('.chart')
      .data(tasks)
      .enter()
      .append('g')
      .append('text')
      .text(d => {
        const maxLength = this.x(d.endDate) - this.x(d.startDate);
        if (maxLength > 0) {
          return d.description.join(', ');
        } else {
          return '';
        }
      })
      .attr('transform', d => { return `translate(${this.x(d.startDate) + 5}, ${this.y(d.taskName) + this.y.bandwidth() - 5})`; })
      .attr('class', 'text-fill');

    // Fill y axix
    this.drawYFillArea();

    // Draw sign and name XML
    this.drawSignAndName();

    const xAx = xaxisArea
      .append('g')
      .attr('class', 'x axis xaxisColor')
      .attr('transform', 'translate(0, ' + -6 + ')')
      .call(this.xAxis);
    const rectDragAxis = xaxisArea
      .append('g')
      .append('rect')
      .attr('class', 'drag-axis')
      .attr('width', this.width - this.margin.right - this.margin.left)
      .attr('height', 18)
      .attr('transform', `translate(0, -24)`)
      .style('opacity', 0);

    // Drag xAxis
    let x1;
    let timeTemp;
    let minDateAble;
    let maxDateAble;
    rectDragAxis.call(
      d3
        .drag()
        .on('start', () => {
          x1 = +d3.event.x;
          timeTemp = this.timeDomainMiddle;
          minDateAble = this.barSelected.startDate ? this.barSelected.startDate : this.mileStoneDate;
          maxDateAble = this.barSelected.endDate ? this.barSelected.endDate : this.endMileStoneDate;
          if (this.dragStartCallback) {
            this.dragStartCallback();
          }
        })
        .on('drag', () => {
          const x2 = +d3.event.x;
          const displacement = x2 - x1;
          if (displacement !== 0) {
            this.timeDomainStart = timeTemp - displacement * this.dragOffsetPerPixel;
            this.timeDomainStart = d3.min([maxDateAble, this.timeDomainStart]);
            this.timeDomainStart = d3.max([minDateAble, this.timeDomainStart]);
            if (this.timeDomainStart - this.timeDomainMiddle !== 0) {
              this.initTimeDomain(null, true);
              this.initAxis();
              if (this.dragCallback) {
                this.dragCallback();
              }
            }
          }
        })
        .on('end', () => {
          if (this.dragEndCallback) {
            this.dragEndCallback();
          }
        })
    );

    this.svg
      .append('g')
      .attr('class', 'y axis')
      .style('font-size', '12px')
      .call(this.yAxis);

    // click opacity
    this.bindAndHandleYAreaEvents();

    // For sign when add multiple xml
    this.drawDivisionBar(isDragDivision);

    // Build this last
    xAx.selectAll('text').each(function (d) {
      if (d < mileSD) {
        this.remove();
      }
    });

    this.svg.selectAll('.y .tick').each((d, i, nodes) => {
      const node = d3.select(nodes[i]);
      let transform = node.attr('transform');
      const newTranslateX =
        -this.margin.left +
        node
          .select('text')
          .node()
          .getBBox().width +
        30 +
        15;
      transform = transform.replace('(0,', `(${newTranslateX},`);
      node.attr('transform', transform);
    });

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.svg
      .append('svg:clipPath')
      .attr('id', 'full-clip-path')
      .append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', -20);
  }

  redraw(isTrasition, targetTime, clickOrSlidDrag = false, speed = 1, resizeSceneArea = false) {
    if (!this.tasks) return;
    this.speed = speed;
    this.initTimeDomain(targetTime, clickOrSlidDrag);
    this.initAxis();
    this.listSceneActive = [];

    const svg = d3.select('.chart');
    const xaxis = d3.select('.xaxis-area');
    const ganttChartGroup = svg.select('.gantt-chart');
    const rect = ganttChartGroup.selectAll('rect.bar').data(this.tasks, this.keyFunction);
    const rectComment = ganttChartGroup.selectAll('rect.rect-comment');

    const t = isTrasition
      ? d3
        .transition()
        .duration(1000 / speed)
        .ease(d3.easeLinear)
      : d3
        .transition()
        .duration(0)
        .ease(d3.easeLinear);

    rect.classed('bar-active-edit-xml', this.isEditXML);

    rect
      .classed('bar-active', this.toggleActiveBarClass.bind(this))
      .transition(t)
      .attr('transform', d => `translate(${this.x(d.startDate)}, ${this.y(d.taskName)})`)
      .attr('width', d => {
        return Math.max(0, this.x(d.endDate) - this.x(d.startDate));
      });

    // Transform new scene bar gantt chart
    if (this.leftRectSBGanttChart) {
      this.leftRectSBGanttChart
        .transition(t)
        .attr('transform', d => `translate(${this.x(d.startDate) - 4},12)`); // sub 4 width itself
    }
    if (this.rightRectSBGanttChart) {
      this.rightRectSBGanttChart
        .transition(t)
        .attr('transform', d => `translate(${this.x(d.endDate)},12)`);
    }
    // End Transform new scene bar gantt chart
    // rect.exit().remove();
    if (this.mapCommentScene && this.mapCommentScene.length && this.isEditXML) {
      rectComment.transition(t).attr('transform', (d, i) => {
        const indexInMapList = this.mapCommentScene.findIndex(mapScene => mapScene.includes(d.scene));
        if (indexInMapList !== -1) {
          return `translate(${this.x(d.time) < 0 ? -60000 : this.x(d.time)}, ${this.y(
            this.mapCommentScene[indexInMapList]
          )})`;
        } else {
          return '';
        }
      });
    }
    const xAx = xaxis
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .select('.x')
      .transition(t)
      .call(this.xAxis);
    const mileSD = this.mileStoneDate;
    const endMileSD = this.endMileStoneDate;
    xAx.selectAll('text').each(function (this, d) {
      d3.select(this).classed('noselect', true);
      if (d < mileSD) {
        this.remove();
      }
    });
    svg.select('.y').call(this.yAxis);
    svg
      .selectAll('text.text-fill')
      .transition(t)
      .text(d => {
        if (this.x(d.endDate) - this.x(d.startDate) > 0) {
          return d.description.join(', ');
        } else {
          return '';
        }
      })
      .attr('transform', d => {
        return `translate(${this.x(d.startDate) + 5}, ${this.y(d.taskName) + this.y.bandwidth() - 5})`;
      })
      .attr('class', 'text-fill');

    if (resizeSceneArea) {
      // Move gantt area
      ganttChartGroup.attr('transform', `translate(${this.margin.left}, -12)`);
      // Resize label background
      this.svg
        .select('rect.rect-label')
        .attr('x', -this.margin.left)
        .attr('width', this.margin.left);
      // Move xml name area
      this.svg.selectAll('path.xml-name-area').attr('d', (d, i) => this.makeTextNameArea(i, d.length - 1));
      // Move all xml name
      this.svg.selectAll('text.xml-name-text.noselect').attr('transform', (d, i) => this.makeSignTextTransform(i));
      // Resize grid line
      this.svg.selectAll('path.domain.h-grid').attr('d', (d, i) => this.makePathGrid(i));
      // Move v-division bar
      this.svg.select('rect.division').attr('transform', `translate(${this.x(this.timeDomainMiddle)}, 12)`);
      // Resize division-xml bar
      this.svg
        .selectAll('rect.division-xml')
        .attr('transform', (d, i) => this.makeFillDivisionArea(i))
        .attr('width', this.width - this.margin.right);
    }
    svg.selectAll('.y .tick').each((d, i, nodes) => {
      const node = d3.select(nodes[i]);
      let transform = node.attr('transform');
      const newTranslateX =
        -this.margin.left +
        node
          .select('text')
          .node()
          .getBBox().width +
        30 +
        15;
      transform = transform.replace('(0,', `(${newTranslateX},`);
      node.attr('transform', transform);
    });
  }

  drawComment(isPlaying = false) {
    d3.selectAll('rect.rect-comment').remove();
    if (this.taskTypes.taskName) {
      this.mapCommentScene = this.listComment
        .map(c => this.taskTypes.taskName.filter(t => t.replace(/_\d+-/g, '') === c.scene)[0])
        .filter(scene => scene);
      if (this.svg && this.listComment && this.listComment.length) {
        const comments = this.svg.selectAll('.chart').data(this.listComment);
        comments
          .enter()
          .append('rect')
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('class', 'rect-comment')
          .attr('y', 0)
          .attr('transform', (d, i) => {
            const indexInMapList = this.mapCommentScene.findIndex(mapScene => mapScene.includes(d.scene));
            if (indexInMapList !== -1) {
              return `translate(${this.x(d.time) < 0 ? -60000 : this.x(d.time)}, ${this.y(
                this.mapCommentScene[indexInMapList]
              )})`;
            } else {
              return '';
            }
          })
          .attr('height', this.y.bandwidth())
          .attr('width', 2)
          .style('fill', 'yellow');
      }
    }
    this.drawDivisionBar();
  }

  handleBarClickEditXML(d, i) {
    if ((!!d && d.isCoverSceneBar) || !d.barId) return;


    if (!this.objEditingSceneBar.isEditing) {
      const isBarSelected = this.barSelected && this.barSelected.id ? this.barSelected.id === `bar-${d.barId}` : false;
      this.clearEndBarCallbackTimeOut();
      if (isBarSelected) {
        this.unFilterBar();
        this.barSelected = {};
      } else {
        this.barSelected = d ? Object.assign({}, d, { id: `bar-${d.barId}` }) : {};
        this.barSelected.barId = d.barId;
        this.barSelected.select = true;
        this.barSelected.index = i;
        this.filterBar();
      }
      if (this.barClickCallback !== null) {
        this.barClickCallback(this.barSelected);
      }
      // Creating left, right scaling for this scene
      if (isBarSelected) {
        this.resetSceneBarScaling();
        this.onClearLeftRightSceneBar(d.id);
        this.isClickedLeftRect = false;
        this.isClickedRightRect = false;
      } else {
        this.objEditingSceneBar.isEditing = false;
        this.onHandleLeftRightSBGanttChart(d);
      }
    } else {
      this.objEditingSceneBar.data = d;
      this.objEditingSceneBar.index = i;
      if (this.barClickCallback !== null) {
        this.barClickCallback(this.barSelected);
      }
    }
  }

  handleBarClick(d, i) {
    const isBarSelected = this.barSelected && this.barSelected.id ? this.barSelected.id === `bar-${i}` : false;
    this.clearEndBarCallbackTimeOut();
    if (isBarSelected) {
      this.unFilterBar();
      this.barSelected = {};
    } else {
      this.barSelected = Object.assign({}, d, { id: `bar-${i}` });
      this.filterBar();
    }
    if (
      d3
        .select(`.${d.taskName.replace(/ +/g, '-').replace(this.regExp, m => chartReplacePair[m])}`)
        .classed('filtered') ||
      this.sceneFiltered.length + this.tagFiltered.length === 0 // Nothing is filtered
    ) {
      this.resetTransition();
      this.timeDomainStart = d.startDate;
      this.redraw(false, null, true);
      // if (this.rectClickCallback !== null) {
      //   this.rectClickCallback();
      // }
      if (this.barClickCallback !== null) {
        this.barClickCallback(this.barSelected);
      }
    } else {
      let additionTime = this.x.invert(d3.event.offsetX);
      additionTime = additionTime - this.sizeZoomMapping.timeRange[this.kZoom] / 9;
      this.timeDomainStart = additionTime;
      this.timeDomainStart = d3.max([this.timeDomainStart, this.mileStoneDate]);
      this.timeDomainStart = d3.min([this.timeDomainStart, this.endMileStoneDate]);
      this.redraw(false, null, true);
      if (this.dragCallback) {
        this.dragCallback();
      }
    }
  }

  handleCommentClick(d: any, i: any) {
    const isBarSelected = this.barSelected && this.barSelected.id ? this.barSelected.id === `bar-${i}` : false;
    if (isBarSelected || i === -1) {
      this.unFilterBar();
      this.barSelected = {};
    } else {
      this.barSelected = Object.assign({}, d, { id: `bar-${i}` });
      this.filterBar();
    }
    return this.barSelected;
  }

  handleFilterBarContextMenu(d: any, i: any) {
    const isBarSelected = this.barSelected && this.barSelected.id ? this.barSelected.id === `bar-${i}` : false;
    if (!isBarSelected) {
      // Filter bar if bar no select
      this.barSelected = Object.assign({}, d, { id: `bar-${i}` });
      this.filterBar();
    }
    // No unfilter bar at add comment in context click
    return this.barSelected;
  }

  bindAndHandleYAreaEvents() {
    // For label events
    d3.selectAll('.y .tick text')
      .attr(
        'class',
        (d, i) =>
          d.replace(/ +/g, '-') +
          ' click-opacity noselect' +
          ` _${this.taskTypes.taskNameDisplay[i].replace(/ +/g, '-')}`
      )
      .on('click', (d, i) => {
        if (!this.isEditXML) {
          this.clearEndBarCallbackTimeOut();
          this.barSelected = {};
          this.timeDomainStart = this.getMinOfTaskType(this.tasks, d);
          const domString = d.replace(/ +/g, '-').replace(this.regExp, m => chartReplacePair[m]);
          const ele = d3.select(`text.click-opacity.${domString}`).style('opacity', 1); // hightlight (just) text tick

          let enable;
          ele.classed('selected', () => {
            if (ele.classed('selected')) {
              this.unFilterASceneInTextClick(domString);
              d3.selectAll('.selected').classed('selected', false);
              enable = false;
            } else {
              this.filterASceneInTextClick(domString);
              this.addItemFilter(this.sceneFiltered, this.taskTypes.taskNameDisplay[i]);
              enable = true;
            }
            return enable;
          });
          if (this.sceneFiltered.length !== 0 && this.listSceneActive.indexOf(this.taskTypes.taskNameDisplay[i]) === -1) {
            this.redraw(false, null, true);
          }
          if (this.rectClickCallback) {
            this.rectClickCallback(d, this.taskTypes.taskNameDisplay[i], enable);
          }
        } else {
          if (this.sceneClickCallback !== null) {
            this.sceneClickCallback(d);
          }
        }
      })
      .on('mouseover', this.handleTooltipLabel.bind(this))
      .on('mouseout', this.handleTooltipLabelOut.bind(this));

    this.svg
      .append('rect')
      .attr('id', 'brush-resize')
      .attr('x', 0)
      .attr('y', 12)
      .attr('width', 0)
      .attr('height', this.height - this.margin.bottom - this.margin.top - 12)
      .style('cursor', 'col-resize')
      .style('fill', '#333')
      .style('fill-opacity', 0.2)
      .style('stroke', '#333')
      .style('stroke-width', 1);

    this.svg
      .append('rect')
      .attr('id', 'brush-resize-control')
      .attr('x', -2)
      .attr('y', 12)
      .attr('width', 4)
      .attr('height', this.height - this.margin.bottom - this.margin.top - 12)
      .style('cursor', 'col-resize')
      .style('fill', '#333')
      .style('fill-opacity', 0)
      .style('stroke', '#333')
      .style('stroke-width', 1)
      .style('stroke-opacity', 0)
      .on('mouseover', function () {
        d3.select(this)
          .style('fill-opacity', 0.2)
          .style('stroke-opacity', 1);
      })
      .on('mousedown', () => (this.startResizeTrigger = true))
      .on('mouseleave', (_, i, nodes) => {
        if (!this.startResizeTrigger) {
          d3.select(nodes[i])
            .style('fill-opacity', 0)
            .style('stroke-opacity', 0);
        }
      });

    d3.select('svg.chart')
      .on('mousemove', (_, i, nodes) => {
        if (this.startResizeTrigger) {
          const currentPosition = d3.mouse(nodes[i])[0];
          let x = Math.min(currentPosition - this.margin.left, 0);
          x = Math.max(50 - this.margin.left, x);
          let w = Math.abs(currentPosition - this.margin.left);
          if (x === 50 - this.margin.left) {
            w = this.margin.left - 50;
          }
          this.svg
            .select('#brush-resize')
            .attr('width', w)
            .attr('x', x);
          this.newScaleNameSize = currentPosition;
        }
      })
      .on('mouseup', () => {
        if (this.startResizeTrigger) {
          this.startResizeTrigger = false;
          this.svg.select('#brush-resize').attr('width', 0);
          this.svg
            .select('#brush-resize-control')
            .style('fill-opacity', 0)
            .style('stroke-opacity', 0);
          this.margin.left = this.newScaleNameSize;
          this.setIsSliding(true);
          this.redraw(false, this.timeDomainMiddle, false, this.speed, true);
          if (this.resizeCallback) {
            this.resizeCallback(this.margin.left);
          }
        }
      });
  }

  drawYFillArea() {
    const yFillArea = this.makeFillArea();
    d3.selectAll('rect.rect-label').remove();
    this.svg
      .append('g')
      .append('rect')
      .attr('class', 'rect-label')
      .attr('x', -this.margin.left)
      .attr('y', yFillArea.startY)
      .attr('width', this.margin.left)
      .attr('height', yFillArea.endY)
      .attr('fill', '#c5c5c5');
  }

  unFilterASceneInTextClick(domString: string) {
    d3.selectAll(`.bar-opacity.${domString}`).classed('filtered', false);
    d3.selectAll(`rect.bar-opacity`).style('opacity', 1);
    d3.selectAll(`text.click-opacity:not(.${domString})`).style('opacity', 1);
    this.clearItemFilter(this.sceneFiltered);
  }

  filterASceneInTextClick(domString: string) {
    d3.selectAll(`.bar-opacity.${domString}`)
      .style('opacity', 1)
      .classed('filtered', true);
    d3.selectAll(`.bar-opacity:not(.${domString})`).style('opacity', 0.3);
    d3.selectAll(`text.click-opacity:not(.${domString})`).style('opacity', 0.3);
    d3.select(`text.click-opacity.selected`).classed('selected', false);
    d3.selectAll(`.filtered.bar-opacity:not(.${domString})`).classed('filtered ', false);
    this.clearItemFilter(this.sceneFiltered);
  }

  filterBar() {
    this.sceneFiltered.forEach(scene => {
      scene = scene.replace(/ +/g, '-').replace(this.regExp, m => chartReplacePair[m]);
      this.unFilterASceneInTextClick(scene);
    });

    if (this.barSelected.taskName) {
      const domString = this.barSelected.taskName.replace(/ +/g, '-').replace(this.regExp, m => chartReplacePair[m]);
      d3.selectAll(`.bar-opacity`).style('opacity', 0.3);
      d3.select(`#${this.barSelected.id}`).style('opacity', 1);

      d3.selectAll(`text.click-opacity:not(.${domString})`).style('opacity', 0.3);
      d3.select(`text.click-opacity.${domString}`).style('opacity', 1);

      d3.select(`text.click-opacity.selected`).classed('selected', false);
      d3.select(`text.click-opacity.${domString}`).classed('selected', true);
      d3.selectAll(`.filtered.bar-opacity`).classed('filtered ', false);
    }
  }

  unFilterBar() {
    d3.selectAll(`.bar-opacity`).style('opacity', 1);

    d3.selectAll(`text.click-opacity`).style('opacity', 1);

    d3.select(`text.click-opacity.selected`).classed('selected', false);
  }

  handleTooltipLabel(d, i) {
    this.tooltip
      .transition()
      .duration(0)
      .style('opacity', 0.9);
    this.tooltip
      .text(this.taskTypes.taskNameDisplay[i])
      .style('left', d3.event.pageX - 20 + 'px')
      .style('top', d3.event.pageY - 20 + 'px');
  }

  handleTooltipLabelOut(d, i) {
    this.tooltip
      .transition()
      .duration(0)
      .style('opacity', 0);
  }

  handleTooltipXMLName(d, i) {
    this.tooltip
      .transition()
      .duration(0)
      .style('opacity', 0.9);
    this.tooltip
      .text(d.name)
      .style('left', d3.event.pageX - 20 + 'px')
      .style('top', d3.event.pageY - 20 + 'px');
  }

  handleTooltipXMLNameOut(d, i) {
    this.tooltip
      .transition()
      .duration(0)
      .style('opacity', 0);
  }

  handleBarContextMenuClick(d, i) {
    d3.event.preventDefault();
    const timeClick = this.x.invert(d3.event.offsetX - this.margin.left);
    if (this.barContextMenuCallback) {
      const position = { x: d3.event.clientX, y: d3.event.clientY };
      this.barContextMenuCallback(d, i, position, timeClick);
    }
  }

  clearEndBarCallbackTimeOut() {
    if (this.endBarCallbackId) {
      clearTimeout(this.endBarCallbackId);
    }
  }

  drawSignAndName() {
    // Draw background XML name
    d3.selectAll('path.xml-name-area').remove();
    this.svg
      .selectAll('.chart')
      .data(this.numTypeOfXML)
      .enter()
      .append('path')
      .attr('class', 'xml-name-area')
      .attr('stroke', '#656667')
      .attr('stroke-width', 1)
      .attr('fill', '#656667')
      .attr('d', (d, i) => this.makeTextNameArea(i, d.length - 1));

    // Draw horizontal division XML
    d3.selectAll('rect.division-xml').remove();
    this.svg
      .selectAll('.chart')
      .data(this.numTypeOfXML)
      .enter()
      .append('g')
      .append('rect')
      .attr('class', 'division-xml')
      .attr('transform', (d, i) => this.makeFillDivisionArea(i))
      .attr('width', this.width - this.margin.right)
      .attr('height', this.widthBar + 1)
      .style('fill', '#6b6b6b');
    // Draw XML name
    d3.selectAll('text.xml-name-text').remove();
    this.svg
      .selectAll('.chart')
      .data(this.numTypeOfXML)
      .enter()
      .append('g')
      .style('font-size', '15px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .append('text')
      .attr('class', 'xml-name-text noselect')
      .attr('text-anchor', 'middle')
      .attr('transform', (d, i) => this.makeSignTextTransform(i))
      .text(d => this.makeXMLNameString(d))
      .on('mouseover', this.handleTooltipXMLName.bind(this))
      .on('mouseout', this.handleTooltipXMLNameOut.bind(this));
    // Draw grid
    d3.selectAll('path.domain.h-grid').remove();
    this.svg
      .selectAll('.chart')
      .data(this.taskTypes.taskName)
      .enter()
      .append('path')
      .attr('class', 'domain h-grid')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .attr('shape-rendering', 'crispEdges')
      .attr('fill', 'none')
      .attr('d', (d, i) => this.makePathGrid(i));
  }

  drawDivisionBar(isDragDivision = true) {
    d3.select('rect.division').remove();
    let x1;
    let timeTemp;
    let minDateAble;
    let maxDateAble;
    let startTimeTemp;
    let startTimeToMiddleBackup;

    if (!!this.svg) {
      if (isDragDivision) {
        this.svg
          .append('rect')
          .attr('class', 'division')
          .attr('transform', `translate(${this.x(this.timeDomainMiddle)}, 12)`)
          .attr('height', this.height - this.margin.top - this.margin.bottom - 12)
          .attr('width', 2)
          .attr('fill', '#42989B')
          .style('cursor', 'grabbing')
          .call(
            d3
              .drag()
              .on('start', () => {
                x1 = +d3.event.x;
                startTimeToMiddleBackup = this.sizeZoomMapping.startTimeToMiddleTimeRange[this.kZoom];
                startTimeTemp = this.timeDomainMiddle - startTimeToMiddleBackup;
                minDateAble = this.barSelected.startDate
                  ? this.barSelected.startDate
                  : d3.max([this.mileStoneDate, startTimeTemp]);
                maxDateAble = this.barSelected.endDate
                  ? this.barSelected.endDate
                  : d3.min([this.endMileStoneDate, this.timeDomainEnd]);
                timeTemp = 0;
                if (this.dragStartCallback) {
                  this.dragStartCallback();
                }
                this.dragOffsetPerPixel =
                  this.sizeZoomMapping.timeRange[this.kZoom] / (this.width - this.margin.right - this.margin.left);
              })
              .on('drag', () => {
                const x2 = +d3.event.x;
                const displacement = x1 - x2;
                const pixelToSeconds = -displacement * this.dragOffsetPerPixel;
                if (displacement !== 0 && timeTemp !== +pixelToSeconds.toFixed(2)) {
                  timeTemp = +pixelToSeconds.toFixed(2); // Time value of drag displacement
                  let middleRangeTemp = startTimeToMiddleBackup + timeTemp; // New middle range (temp)
                  middleRangeTemp = Math.min(middleRangeTemp, this.sizeZoomMapping.timeRange[this.kZoom]);
                  this.timeDomainMiddle = startTimeTemp + middleRangeTemp;
                  if (this.timeDomainMiddle - minDateAble >= 0 && this.timeDomainMiddle - maxDateAble <= 0) {
                    this.startTimeToMiddleTimeRange = middleRangeTemp;
                  } else {
                    this.startTimeToMiddleTimeRange = Math.min(
                      this.sizeZoomMapping.timeRange[this.kZoom],
                      Math.max(minDateAble - startTimeTemp, middleRangeTemp)
                    );
                  }

                  this.timeDomainMiddle = d3.min([this.timeDomainMiddle, maxDateAble]);
                  this.timeDomainMiddle = d3.max([this.timeDomainMiddle, minDateAble]);
                  this.drawDivisionBar();
                  if (this.dragCallback) {
                    this.dragCallback(this.startTimeToMiddleTimeRange);
                  }
                }
              })
              .on('end', () => {
                // Check when call event click - start time middle time range no change
                if (startTimeToMiddleBackup !== this.startTimeToMiddleTimeRange / this.kZoom) {
                  if (this.dragEndCallback) {
                    this.dragEndCallback(this.startTimeToMiddleTimeRange);
                  }
                  this.startTimeToMiddleTimeRange *= this.kZoom; // Value in kZoom = 1
                  this.createSizeZoomMapping();
                }
              })
          );
      } else {
        this.svg
          .append('rect')
          .attr('class', 'division')
          .attr('transform', `translate(${this.x(this.timeDomainMiddle)}, 12)`)
          .attr('height', this.height - this.margin.top - this.margin.bottom - 12)
          .attr('width', 2)
          .attr('fill', '#42989B');
      }
    }

  }

  removeAll() {
    d3.select(this.selector)
      .selectAll('*')
      .remove();
    d3.select('#gantt-xaxix')
      .selectAll('*')
      .remove();
    d3.select('div.tooltip').remove();
  }

  addItemFilter(filteredArray: any[], item: string) {
    if (filteredArray.indexOf(item) === -1) {
      filteredArray.push(item);
    }
  }

  clearItemFilter(filteredArray: any[]) {
    filteredArray.length = 0;
  }

  isFiltered(item) {
    const indexInSceneFiltered = this.sceneFiltered.indexOf(item);
    // const indexInTagFiltered = this.tagFiltered.indexOf(item);
    return indexInSceneFiltered !== -1;
  }

  isSceneWithTagFilterActive() {
    for (const sceneFilter of this.sceneFiltered) {
      if (this.listSceneActive.indexOf(sceneFilter) !== -1) {
        if (this.tagFiltered.length === 0) {
          return true;
        }
        // scene filtered and active
        for (const tagFilter of this.tagFiltered) {
          if (
            this.tagsInScene[tagFilter] &&
            this.tagsInScene[tagFilter].indexOf(sceneFilter) !== -1 &&
            this.isAtTime(sceneFilter, tagFilter)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isAtTime(scene: string, tag?: string) {
    for (const task of this.tasks) {
      if (
        task.startDate <= this.timeDomainMiddle &&
        task.endDate >= this.timeDomainMiddle &&
        scene === task.taskNameDisplay &&
        task.description.indexOf(tag) !== -1
      ) {
        return true;
      }
    }
    return false;
  }

  resetTransition() {
    d3.selectAll('*').interrupt();
  }

  setTimeDomain(values: any) {
    if (arguments.length) {
      this.timeDomainStart = values;
      // this.timeDomainEnd = d3.timeSecond.offset(this.timeDomainStart, this.timeRange);
    }
  }

  setRangeTime(value, isFirstSet = true) {
    if (arguments.length) {
      this.timeRange = +value;
      if (isFirstSet) {
        this.startTimeToMiddleTimeRange = this.timeRange / 2;
      } else {
        this.startTimeToMiddleTimeRange = Math.min(this.startTimeToMiddleTimeRange, this.timeRange);
      }
    }
  }

  setTaskTypes(value: any) {
    if (arguments.length) {
      this.taskTypes = value;
    }
  }

  setNumTypeOfXML(value: any[]) {
    if (arguments.length) {
      this.numTypeOfXML = value;
    }
  }

  setWidth(value) {
    if (arguments.length) {
      this.width = +value;
    }
  }

  setHeight(value) {
    if (arguments.length) {
      this.height = +value;
    }
  }

  setTickFormat(value) {
    if (arguments.length) {
      this.tickFormat = value;
    }
  }

  setSelector(value) {
    if (arguments.length) {
      this.selector = value;
    }
  }

  setDragCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.dragCallback = callback;
    }
  }

  setDragEndCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.dragEndCallback = callback;
    }
  }

  setDragStartCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.dragStartCallback = callback;
    }
  }

  setEndSceneCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.endSceneCallback = callback;
    }
  }

  setResizeCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.resizeCallback = callback;
    }
  }

  setMileStoneDates(values: any[]) {
    if (arguments.length) {
      this.mileStoneDate = values[0];
      this.endMileStoneDate = values[1];
    }
  }

  getTimeDomainMiddle() {
    return this.timeDomainMiddle;
  }

  getIsSliding() {
    return this.isSliding;
  }

  setIsSliding(value) {
    if (arguments.length) {
      this.isSliding = value;
    }
  }

  setSceneFiltered(value: any[]) {
    if (arguments.length) {
      this.sceneFiltered = value;
    }
  }

  setTagFiltered(value: any[]) {
    if (arguments.length) {
      this.tagFiltered = value;
    }
  }

  filterAllScene() {
    d3.selectAll('.click-opacity,.bar-opacity').style('opacity', 1);
    d3.selectAll('.click-opacity').classed('selected', true);
    d3.selectAll('.bar-opacity').style('filtered', true);
  }

  removeFilterAllScene() {
    d3.selectAll('.click-opacity,.bar-opacity')
      .classed('selected', false)
      .classed('filtered', false)
      .style('opacity', 0.3);
  }

  filterAScene(scene: string, checkSceneTagFilerActive: boolean = true) {
    scene = scene
      .trim()
      .replace(/ +/g, '-')
      .replace(this.regExp, m => chartReplacePair[m]);
    d3.selectAll(`.click-opacity._${scene}`)
      .classed('selected', true)
      .style('opacity', 1);
    d3.selectAll(`.bar-opacity._${scene}`)
      .classed('filtered', true)
      .style('opacity', 1);
    return checkSceneTagFilerActive && this.isSceneWithTagFilterActive();
  }

  private getMinOfTaskType(tasks: any[], taskType: string) {
    return d3.min(tasks.filter(t => t.taskName === taskType), t => t.startDate);
  }

  getListSceneActive() {
    return this.listSceneActive;
  }

  getTheLastSceneActiveIndex() {
    return this.listSceneActive.length && this.lastActiveSceneIndex;
  }

  setListComment(listComment) {
    if (arguments.length) {
      this.listComment = listComment;
    }
  }

  getSelectedBar() {
    return this.barSelected;
  }

  setBarClickCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.barClickCallback = callback;
    }
  }

  setSceneClickCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.sceneClickCallback = callback;
    }
  }

  setBarContextMenuCallback(callback) {
    if (arguments.length && {}.toString.call(callback) === '[object Function]') {
      this.barContextMenuCallback = callback;
    }
  }

  // Description from string to string array

  // Push only if description never exist in listTagActive
  pushDescriptionsToListTagActive(descriptions: string[]) {
    descriptions.forEach(d => {
      if (this.listTagActive.indexOf(d) === -1) {
        this.listTagActive.push(d);
      }
    });
  }

  // init tagsInScene
  initTagsInScene(descriptions: string[], taskNameDisplay: string) {
    descriptions.forEach(d => {
      if (!this.tagsInScene[`${d}`]) {
        this.tagsInScene[`${d}`] = [];
      }
      if (this.tagsInScene[`${d}`].indexOf(taskNameDisplay) === -1) {
        this.tagsInScene[`${d}`].push(taskNameDisplay);
      }
    });
  }

  createSizeZoomMapping() {
    this.sizeZoomMapping = {
      startTimeToMiddleTimeRange: this.createValueMappingFromZoomOptions(this.startTimeToMiddleTimeRange),
      timeRange: this.createValueMappingFromZoomOptions(this.timeRange)
    };
  }

  createValueMappingFromZoomOptions(value: number) {
    const valueMapping: any = {};
    const { MIN_ZOOM, MAX_ZOOM, STEP_ZOOM } = ZOOM_OPTIONS;

    let keyMapping = MIN_ZOOM;

    while (keyMapping <= MAX_ZOOM) {
      valueMapping[keyMapping] = value / keyMapping;
      keyMapping = (keyMapping * 10 * 10 + STEP_ZOOM * 100) / 100;
    }

    return valueMapping;
  }

  changeKZoom(value: number) {
    this.kZoom = value;
  }

  // Space for editing XML

  /***
   * Lưu lại giá trị left, right khi scaling bar trên time line
   * Khi scaling new scene bar, cập nhật lại giá trị left, right của scene liền trước, liền sau
   * đã thao tác trên bar time line tương ứng
   * @param event
   * {
   *   "id":"startStop-1",
       "isScaling":true,
       "objPreLeftRight":{"preLeft":2.6301866666666665,"subRight":6.183169}
    /}
   */
  onSaveListScalingLeftRightNewScene(event: any): void {
    const index = this.scalingLeftRightObjList.findIndex(item => item.id === event.id);
    if (index > -1) {
      this.scalingLeftRightObjList[index] = event;
    } else {
      this.scalingLeftRightObjList.push(event);
    }
    this.observableScalingLeftRightObjList.next(this.scalingLeftRightObjList);
  }

  getPreviousLeftRightBeforeScaling(newSceneId: string): any {
    const index = this.scalingLeftRightObjList.findIndex(item => item.id === newSceneId);
    if (index > -1) {
      return this.scalingLeftRightObjList[index].objPreLeftRight;
    }
    return null;
  }

  onHandleScalingFromSceneBarTimeline(scalingSceneBar: SceneBarScaling) {
    const leftRect = d3.select('rect#leftRectSBGanttChart');
    const rightRect = d3.select('rect#rightRectSBGanttChart');
    const rectScaling = d3.select('rect#bar-' + scalingSceneBar.id);
    const textScaling = d3.select('text#textBar-' + scalingSceneBar.id);
    if (leftRect && rightRect && rectScaling) {
      if (scalingSceneBar.startTime != this.sceneBarScaling.startTime) {
        const xCurrentTranslate = this.x(scalingSceneBar.startTime);
        this.sceneBarScaling.startTime = scalingSceneBar.startTime;
        leftRect.attr('transform', `translate(${xCurrentTranslate},12)`);
        rectScaling.attr('transform', `translate(${xCurrentTranslate},12)`);
        rectScaling.attr('width', () => {
          return Math.max(0, this.x(scalingSceneBar.endTime) - this.x(scalingSceneBar.startTime));
        });
        textScaling.attr('transform', `translate(${xCurrentTranslate + 5}, ${12 + this.y.bandwidth() - 5})`);

        const objModifyScene = {
          barId: scalingSceneBar.id,
          startDate: scalingSceneBar.startTime
        };
        this.updateTaskAfterScalingSceneBar(objModifyScene);
        this.sceneBarScaling.startTime = scalingSceneBar.startTime;
        this.videoChartService.seek(true, scalingSceneBar.startTime, false, true);
      }
      if (scalingSceneBar.endTime != this.sceneBarScaling.endTime) {
        const xCurrentTranslate = this.x(scalingSceneBar.endTime);
        this.sceneBarScaling.endTime = scalingSceneBar.endTime;
        rightRect.attr('transform', `translate(${xCurrentTranslate},12)`);
        rectScaling.attr('width', () => {
          return Math.max(0, this.x(scalingSceneBar.endTime) - this.x(scalingSceneBar.startTime));
        });

        const objModifyScene = {
          barId: scalingSceneBar.id,
          endDate: scalingSceneBar.endTime
        };
        this.updateTaskAfterScalingSceneBar(objModifyScene);
        this.sceneBarScaling.endTime = scalingSceneBar.endTime;
        this.videoChartService.seek(true, scalingSceneBar.endTime, false, true);
      }
      this.videoChartService.seekEnd();
    }
    //
    else {

    }
  }

  /***
   * Thực thi khi click vào thanh thời gian video
   * Hàm dùng cho scaling 2 đầu của scene trong gantt chart
   * Hướng ảnh hưởng: thay đổi từ scene trong gantt chart -> thanh thời gian video tương ứng
   * Khi thay đổi 2 đầu của scene thì thanh thời gian tương ứng thay đổi theo
   * Scaling 2 đầu bị giới hạn 2 đầu bởi những scene nằm trước và sau tương ứng
   * @param objEvent : là một object có các thuộc tính như sau:
   * {
   *  idGroup: string,
      startDate: string,
      leftPathId: string,
      rightPathId: string,
      maxTimeSliderScale: number,
      widthSVG: number
     }
   */
  onHandleLeftRightSBGanttChart(sceneBarClicked) {
    let xCoordinate = 0;
    let xPreviousTranslate = 0;
    let xCurrentTranslate = 0;
    let hasDrag = false;
    let rectStopAt = 0;
    let rectStarAt = 0;
    let curWidthSceneBar = 0;
    if (sceneBarClicked) {
      this.sceneBarScaling.id = +sceneBarClicked.barId;
      this.sceneBarScaling.startTime = +sceneBarClicked.startDate;
      this.sceneBarScaling.endTime = +sceneBarClicked.endDate;
      // const noId = sceneBarClicked.id.split('-')[1];
      const noId = +sceneBarClicked.barId;
      // Updating previous left
      const tempObj = this.getPreviousLeftRightBeforeScaling('startStop-' + noId);
      if (tempObj) {
        sceneBarClicked.objPreLeftRight = tempObj;
      }
      // End Updating previous left
      const rectLeft = d3.select('#leftRectSBGanttChart');
      const rectRight = d3.select('#rightRectSBGanttChart');
      if (rectLeft) {
        rectLeft.remove();
      }
      if (rectRight) {
        rectRight.remove();
      }
      if (!isNaN(noId)) {
        const groupElem = d3.select('#groupBar-' + noId);

        // Creating left rect to scaling scene
        this.leftRectSBGanttChart = groupElem
          .append('rect')
          .attr('id', 'leftRectSBGanttChart')
          .attr('class', '')
          .attr('y', 0)
          .attr('transform', d => {
            return `translate(${this.x(d.startDate) - 4}, 12)`; // sub 4 pixel width of leftRectBar
          })
          .attr('height', 21)
          .attr('width', 4)
          .style('fill', 'black')
          .style('cursor', 'col-resize')
          .call(d3.drag()
            .on('start', () => {
              if (!this.isPlaying) {
                for (const item of this.tasks) {
                  if (item.barId === sceneBarClicked.barId) {
                    if (this.sceneBarScaling.id > -1) {
                      xPreviousTranslate = this.sceneBarScaling.startTime;
                      rectStopAt = this.sceneBarScaling.endTime;
                    } else {
                      xPreviousTranslate = item.startDate;
                      rectStopAt = item.endDate;
                    }
                    break;
                  }
                }
                xCoordinate = 0;
                // Changing cursor for UI
                const scaleTimeSVG = d3.select('body');
                if (scaleTimeSVG) {
                  scaleTimeSVG.style('cursor', 'col-resize');
                }
              }
            })
            .on('drag', () => {
              if (!this.isPlaying) {
                hasDrag = true;
                xCoordinate += d3.event.dx;
                xCurrentTranslate = this.x(xPreviousTranslate) + xCoordinate;
                curWidthSceneBar = this.x(rectStopAt) - xCurrentTranslate;
                // Ngăn scaling vượt quá thời gian bắt đầu của video
                if (xCurrentTranslate < this.x(0)) {
                  xCurrentTranslate = this.x(0);
                  curWidthSceneBar = this.x(rectStopAt) - xCurrentTranslate;
                }
                // Ngăn scaling vượt quá thời gian kết thúc của đoạn hiện tại
                if (xCurrentTranslate > this.x(sceneBarClicked.endDate)) {
                  xCurrentTranslate = this.x(sceneBarClicked.endDate);
                  curWidthSceneBar = this.x(rectStopAt) - xCurrentTranslate;
                }
                // Ngăn scaling vượt quá scene liền trước
                if (sceneBarClicked.objPreLeftRight) {
                  if (this.x.invert(xCurrentTranslate) < sceneBarClicked.objPreLeftRight.preLeft) {
                    curWidthSceneBar = this.x(rectStopAt) - xCurrentTranslate;
                    return;
                  }
                }
                this.leftRectSBGanttChart
                  .attr('transform', `translate(${xCurrentTranslate},12)`); // sub 4 pixel width of leftRectBar
                d3.select('#bar-' + noId)
                  .attr('transform', `translate(${xCurrentTranslate},12)`)
                  .attr('width', () => {
                    return Math.max(0, curWidthSceneBar);
                  });
                d3.select('text#textBar-' + noId)
                  .attr('transform', `translate(${xCurrentTranslate + 5}, ${12 + this.y.bandwidth() - 5})`);
                this.sceneBarScaling.startTime = this.x.invert(xCurrentTranslate);
                this.obsSceneBarScaling.next(true);
              }
            })
            .on('end', () => {
              if (!this.isPlaying) {
                if (hasDrag) {
                  hasDrag = false;
                  this.objEditingSceneBar.isEditing = true;
                  // Save new startAt to listTaskFormatted
                  for (const item of this.tasks) {
                    if (item.idNewScene === sceneBarClicked.idNewScene) {
                      item.startDate = this.x.invert(xCurrentTranslate);
                      break;
                    }
                  }
                  // Updating value left scene after scaling on new scene bar on gantt chart
                  const index = this.scalingLeftRightObjList.findIndex(item => item.id === 'bar-' + (+noId - 1));
                  if (index > -1) {
                    this.scalingLeftRightObjList[index].objPreLeftRight.subRight = this.x.invert(xCurrentTranslate);
                  }
                  const objModifyScene = {
                    id: sceneBarClicked.id,
                    startDate: this.x.invert(xCurrentTranslate)
                  };
                  this.updateTaskAfterScalingSceneBar(objModifyScene);
                }
                const scaleTimeSVG = d3.select('body');
                if (scaleTimeSVG) {
                  scaleTimeSVG.style('cursor', 'auto');
                }
              }
            }));

        // Creating right rect to scaling scene
        this.rightRectSBGanttChart = groupElem
          .append('rect')
          .attr('id', 'rightRectSBGanttChart')
          .attr('class', '')
          .attr('y', 0)
          .attr('transform', d => {
            return `translate(${this.x(d.endDate)}, 12)`; // add 4 pixel width of itself
          })
          .attr('height', 21)
          .attr('width', 4)
          .style('fill', 'black')
          .style('cursor', 'col-resize')
          .call(d3.drag()
            .on('start', () => {
              if (!this.isPlaying) {
                for (const item of this.tasks) {
                  if (item.barId === sceneBarClicked.barId) {
                    if (this.sceneBarScaling.id > -1) {
                      xPreviousTranslate = this.sceneBarScaling.endTime;
                      rectStarAt = this.sceneBarScaling.startTime;
                    } else {
                      xPreviousTranslate = this.x(item.endDate);
                      rectStarAt = item.startDate;
                    }
                    break;
                  }
                }
                // isDraggedLeft = true;
                xCoordinate = 0;
                // Changing cursor for UI
                const scaleTimeSVG = d3.select('body');
                if (scaleTimeSVG) {
                  scaleTimeSVG.style('cursor', 'col-resize');
                }
              }
            })
            .on('drag', () => {
              if (!this.isPlaying) {
                hasDrag = true;
                xCoordinate += d3.event.dx;
                xCurrentTranslate = this.x(xPreviousTranslate) + xCoordinate;
                // // Ngăn scaling vượt quá thời gian bắt đầu của đoạn hiện tại
                if (xCurrentTranslate < this.x(rectStarAt)) {
                  xCurrentTranslate = this.x(rectStarAt);
                }
                // // Ngăn scaling vượt quá scene liền sau
                if (sceneBarClicked.objPreLeftRight &&
                  xCurrentTranslate > this.x(sceneBarClicked.endDate)) {
                  if (this.x.invert(xCurrentTranslate) > sceneBarClicked.objPreLeftRight.subRight) {
                    return;
                  }
                }
                this.rightRectSBGanttChart.attr('transform', `translate(${xCurrentTranslate},12)`);
                d3.select('#bar-' + noId)
                  .attr('width', () => {
                    return Math.max(0, xCurrentTranslate - this.x(rectStarAt));
                  });
                this.sceneBarScaling.endTime = this.x.invert(xCurrentTranslate);
                this.obsSceneBarScaling.next(true);
              }
            })
            .on('end', () => {
              if (!this.isPlaying) {
                if (hasDrag) {
                  hasDrag = false;
                  this.objEditingSceneBar.isEditing = true;
                  // Updating value left scene after scaling on new scene bar on gantt chart
                  const index = this.scalingLeftRightObjList.findIndex(item => item.id === 'bar-' + (+noId + 1));
                  if (index > -1) {
                    this.scalingLeftRightObjList[index].objPreLeftRight.preLeft = this.x.invert(xCurrentTranslate);
                    this.observableScalingLeftRightObjList.next(this.scalingLeftRightObjList);
                  }
                  const objModifyScene = {
                    id: sceneBarClicked.id,
                    endDate: this.x.invert(xCurrentTranslate)
                  };
                  this.updateTaskAfterScalingSceneBar(objModifyScene);
                }
              }
              const scaleTimeSVG = d3.select('body');
              if (scaleTimeSVG) {
                scaleTimeSVG.style('cursor', 'auto');
              }
            }));
      }
    }
  }

  updateTaskAfterScalingSceneBar(objModifyScene: any): void {
    if (objModifyScene.id !== undefined) {
      const index = this.tasks.findIndex(item => item.id === objModifyScene.id);
      if (index >= 0) {
        if (objModifyScene.startDate !== undefined) {
          this.tasks[index].startDate = objModifyScene.startDate;
          this.barSelected.startDate = objModifyScene.startDate;
          this.sceneBarScaling.startTime = objModifyScene.startDate;
        }
        if (objModifyScene.endDate !== undefined) {
          this.tasks[index].endDate = objModifyScene.endDate;
          this.barSelected.endDate = objModifyScene.endDate;
          this.sceneBarScaling.endTime = objModifyScene.endDate;
        }
      }
    }

    if (objModifyScene.barId !== undefined) {
      const index = this.tasks.findIndex(item => item.barId === objModifyScene.barId);
      if (index >= 0) {
        if (objModifyScene.startDate !== undefined) {
          this.tasks[index].startDate = objModifyScene.startDate;
          this.barSelected.startDate = objModifyScene.startDate;
          this.sceneBarScaling.startTime = objModifyScene.startDate;
        }
        if (objModifyScene.endDate !== undefined) {
          this.tasks[index].endDate = objModifyScene.endDate;
          this.barSelected.endDate = objModifyScene.endDate;
          this.sceneBarScaling.endTime = objModifyScene.endDate;
        }
      }
    }
  }

  /***
   * Phạm vi: chỉ dành cho thao tác thêm scene trong xml
   * Thực thi khi click icon xóa
   * Xóa các new scene trong gantt chart
   * @param idGroup là string của id các svg khi vẽ thêm new scene
   */
  removeNewSceneById(idGroup: string): boolean {
    if (idGroup !== '') {
      return (d3.select(idGroup).remove());
    }
    return false;
  }

  /***
   * Thực thi khi click vào thanh thời gian video
   * Hàm dùng cho scaling 2 đầu của scene trong gantt chart
   * Hướng ảnh hưởng: thay đổi 2 đầu thanh video -> scene trong gantt chart tương ứng sẽ thay đổi theo
   * @param event là object có props:
   * {
       idNewScene: string,
       pathSide: string,
       startAt: number,
       stopAt: number,
       width: number
   * }
   */
  changeLeftRightScene(event: any) {
    const noId = event.idNewScene.split('-')[1];
    const idSceneChanged = '#bar-' + noId;
    const idTextBar = '#textBar-' + noId;
    const currentBar = d3.select(idSceneChanged);
    if (event.pathSide === 'left') {
      const leftRectBar = d3.select('#leftRectSBGanttChart');
      // Transform scene bar
      currentBar.attr('transform', `translate(${this.x(event.startAt)},12)`)
        .attr('width', Math.max(0, this.x(event.stopAt) - this.x(event.startAt)));
      // Transform text bar
      d3.select(idTextBar)
        .attr('transform', `translate(${this.x(event.startAt) + 5}, ${12 + this.y.bandwidth() - 5})`);
      // Transform left rect bar
      if (leftRectBar) {
        leftRectBar.attr('transform', `translate(${this.x(event.startAt) - 4},12)`); // sub 4 pixel width of leftRectBar
      }
    } else if (event.pathSide === 'right') {
      const rightRectBar = d3.select('#rightRectSBGanttChart');
      // currentBar.attr('width', Math.max(0, this.x(event.stopAt) - this.x(event.startAt)));
      // Transform scene bar
      currentBar.attr('transform', `translate(${this.x(event.startAt)},12)`)
        .attr('width', Math.max(0, this.x(event.stopAt) - this.x(event.startAt)));
      // Transform text bar
      d3.select(idTextBar)
        .attr('transform', `translate(${this.x(event.startAt) + 5}, ${12 + this.y.bandwidth() - 5})`);
      // Transform right rect bar
      if (rightRectBar) {
        rightRectBar.attr('transform', `translate(${this.x(event.stopAt)},12)`); // add 4 pixel width of leftRectBar
      }
    }
  }

  buildNewSceneScalingTime(tasks: any[], isDragDivision?: boolean, widthGanntChart?: number) {
    let numTypeOfXmlValid = false;
    for (var i = 0; i <= this.numTypeOfXML.length - 1; i++) {
      if (this.numTypeOfXML[i].length > 1) {
        numTypeOfXmlValid = true;
        break;
      }
    }
    // Pushing previous left right new scene bar
    tasks.forEach(item => {
      const obj = {
        id: item.id,
        isScaling: true,
        objPreLeftRight: item.objPreLeftRight
      };
      this.onSaveListScalingLeftRightNewScene(obj);
    });
    // End Pushing previous left right new scene bar
    this.tasks = tasks;
    this.sceneFiltered = [];
    this.tagFiltered = [];
    this.listSceneActive = [];
    this.listTagActive = [];
    this.tagsInScene = {};
    this.height = (this.widthBar + 1) * this.taskTypes.taskName.length + 45;
    this.width = widthGanntChart || this.containerWidth;
    const mileSD = this.mileStoneDate; // minimum date
    const endMileSD = this.endMileStoneDate; // maximum date
    this.createSizeZoomMapping();
    this.initTimeDomain(this.currentTimeSceneBarIsChosen);
    this.initAxis();

    const xaxisArea = d3
      .select('#gantt-xaxix')
      .append('svg')
      .attr('class', 'xaxis')
      .attr('width', this.width)
      .attr('height', 20)
      .append('g')
      .attr('class', 'xaxis-area')
      .attr('height', 20)
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.svg = d3
      .select(this.selector)
      .append('svg')
      .attr('class', 'chart')
      .attr('width', this.width)
      .attr('height', this.height - 18 - 12 - 12)
      .append('g')
      .attr('class', 'gantt-chart')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', `translate(${this.margin.left}, -12)`);

    const groupRect = this.svg.selectAll('.chart')
      .data(tasks)
      .enter()
      .append('g')
      .attr('id', (d, i) => {
        return `groupBar-${d.barId}`;
      });
    // rects
    const rects = groupRect
      .append('rect')
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('class', this.activeBarClassEditXML.bind(this))
      .attr('id', (d, i) => `bar-${d.barId}`)
      .attr('y', 0)
      .attr('transform', d => {
        return `translate(${this.x(d.startDate)}, 12)`;
      })
      .attr('height', d => {
        return this.y.bandwidth();
      })
      .attr('width', d => {
        return Math.max(0, this.x(d.endDate) - this.x(d.startDate));
      })
      .style('fill', d => {
        return d.color;
      });

    // rects click
    rects
      .on('click', this.handleBarClickEditXML.bind(this))
      .on('contextmenu', this.handleBarContextMenuClick.bind(this));
    // rects comment
    groupRect
      .append('text')
      .attr('id', (d, i) => {
        return `textBar-${d.barId}`;
      })
      .text(d => {
        const maxLength = this.x(d.endDate) - this.x(d.startDate);
        if (maxLength > 0) {
          return d.description.join(', ');
        } else {
          return '';
        }
      })
      .attr('transform', d => {
        return `translate(${this.x(d.startDate) + 5}, ${12 + this.y.bandwidth() - 5})`;
      })
      .attr('class', 'text-fill')
      .style('cursor', 'default')
      .on('click', this.handleBarClickEditXML.bind(this));

    // Fill y axix
    this.drawYFillArea();
    // Draw sign and name XML
    this.drawSignAndName();
    const xAx = xaxisArea
      .append('g')
      .attr('class', 'x axis xaxisColor')
      .attr('transform', 'translate(0, ' + -6 + ')')
      .call(this.xAxis);
    const rectDragAxis = xaxisArea
      .append('g')
      .append('rect')
      .attr('class', 'drag-axis')
      .attr('width', this.width - this.margin.right - this.margin.left)
      .attr('height', 18)
      .attr('transform', `translate(0, -24)`)
      .style('opacity', 0);
    // Drag xAxis
    let x1;
    let timeTemp;
    let minDateAble;
    let maxDateAble;
    rectDragAxis.call(
      d3
        .drag()
        .on('start', () => {
          x1 = +d3.event.x;
          timeTemp = this.timeDomainMiddle;
          minDateAble = this.barSelected.startDate ? this.barSelected.startDate : this.mileStoneDate;
          maxDateAble = this.barSelected.endDate ? this.barSelected.endDate : this.endMileStoneDate;
          if (this.dragStartCallback) {
            this.dragStartCallback();
          }
        })
        .on('drag', () => {
          const x2 = +d3.event.x;
          const displacement = x2 - x1;
          if (displacement !== 0) {
            this.timeDomainStart = timeTemp - displacement * this.dragOffsetPerPixel;
            this.timeDomainStart = d3.min([maxDateAble, this.timeDomainStart]);
            this.timeDomainStart = d3.max([minDateAble, this.timeDomainStart]);
            if (this.timeDomainStart - this.timeDomainMiddle !== 0) {
              this.initTimeDomain(null, true);
              this.initAxis();
              if (this.dragCallback) {
                this.dragCallback();
              }
            }
          }
        })
        .on('end', () => {
          if (this.dragEndCallback) {
            this.dragEndCallback();
          }
        })
    );

    this.svg
      .append('g')
      .attr('class', 'y axis')
      .style('font-size', '12px')
      .call(this.yAxis);
    // click opacity
    this.bindAndHandleYAreaEvents();
    // For sign when add multiple xml
    this.drawDivisionBar(isDragDivision);
    // Build this last
    xAx.selectAll('text').each(function (d) {
      if (d < mileSD) {
        this.remove();
      }
    });
    this.svg.selectAll('.y .tick').each((d, i, nodes) => {
      const node = d3.select(nodes[i]);
      let transform = node.attr('transform');
      const newTranslateX =
        -this.margin.left +
        node
          .select('text')
          .node()
          .getBBox().width +
        30 +
        15;
      transform = transform.replace('(0,', `(${newTranslateX},`);
      node.attr('transform', transform);
    });

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.svg
      .append('svg:clipPath')
      .attr('id', 'full-clip-path')
      .append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', -20);
  }

  /***
   * Xóa 2 nút left và right scaling của scene bar đang chọn
   * @param sceneBarId: string, exp: startStop-0
   */
  onClearLeftRightSceneBar(sceneBarId: string): void {
    // tslint:disable-next-line:no-unused-expression
    d3.select('rect#leftRectSBGanttChart').remove();
    // tslint:disable-next-line:no-unused-expression
    d3.select('rect#rightRectSBGanttChart').remove();
  }

  onUpdateNewSceneTemp(data: any) {
    if (data.isUpdateScene) {
      const size = this.tasks.length;
      for (let i = 0; i < size; i++) {
        d3.select('#bar-' + i).style('fill', data.sceneColor);
      }
      this.taskTypes.taskNameDisplay[0] = data.sceneName;
      d3.select('.y .tick text').text(d => data.sceneName);
      this.redraw(false, null, true);
    }
  }

  activeBarClassEditXML(d: any, i: number): string {
    const classString = `${d.taskName.replace(/ +/g, '-')} _${d.taskNameDisplay.replace(/ +/g, '-')} bar-opacity bar`;
    if (d.startDate <= this.timeDomainMiddle && d.endDate >= this.timeDomainMiddle) {
      if (this.listSceneActive.indexOf(d.taskNameDisplay.trim()) !== -1) {
        this.listSceneActive.push(d.taskNameDisplay.trim());
        this.lastActiveSceneIndex = i;
      }
      if (d.description.length) {
        this.pushDescriptionsToListTagActive(d.description);
      }
    }
    if (d.description.length) {
      this.initTagsInScene(d.description, d.taskNameDisplay);
    }
    return classString;
  }

  drawChartNewSceneBarEmpty(objNewScene: any) {
  }

  private resetSceneBarScaling() {
    this.sceneBarScaling.id = -1;
    this.sceneBarScaling.startTime = 0;
    this.sceneBarScaling.endTime = 0;
  }

  onRevertSceneBarGanttChart(sceneBarOriginal: SceneBar) {
    const index = this.tasks.findIndex(item => item.barId === sceneBarOriginal.id);
    if (index > -1) {
      this.tasks[index].startDate = sceneBarOriginal.startTime;
      this.tasks[index].endDate = sceneBarOriginal.endTime;
    }
  }
  // End space for editing XML
}
