import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { VideoChartService } from '@app/core/services/component-services/video-chart.service';
import { DateUtil } from '@app/shared/utils/date';
import { ZOOM_OPTIONS } from '@app/configs/app-constants';

@Injectable()
export class LineChartService {
  id: string; // Line chart id
  margin = { top: 10, right: 1, bottom: 20, left: 120 };
  // width of frame line chart
  width: number;
  // height of frame line chart
  height: number;
  // g frame
  g: any;
  // lines line in line chart
  lines: any;
  lineCircles: any;

  //
  xScale: any;
  yScale: any;
  xAxis: any;
  yAxis: any;
  // tooltip of line chart
  tooltip: any;
  //
  gridX: any;
  gridY: any;
  // length time of video
  duration: number;
  // extent of brush in line chart
  extent: any;
  // zoom line chart
  zoom: any;
  gPath: any;
  // create rect for action
  rect: any;
  // max value of video
  maxValue: number;
  svg: any;
  // width of tooltip
  widthTooltip = 120;
  x;
  // kZoom zoom of zoom() default = 1
  kZoom = 1;
  data: any[];

  isFirstCreateChart = true;

  // For sliding chart
  domainStart = 0;
  currentTime = 0;
  domainEnd = 0;
  timeRange = 90;
  startTimeToMiddleTimeRange = 45;
  sizeZoomMapping: {
    timeRange: any;
    startTimeToMiddleTimeRange: any;
  };

  speed = 1;
  paddingLeftXscale = 0;

  constructor(private videoChartService: VideoChartService, private dateUtil: DateUtil) {
    this.videoChartService.maxValueVideo.subscribe(res => {
      this.maxValue = res;
    });
    // get duration of video
    // this.videoChartService.duration.subscribe(res => {
    //   this.duration = res;
    // });

    // this.videoChartService.dataVideoChange.subscribe(res => {
    //   this.data = res;
    //   if (!this.isFirstCreateChart) {
    //     this.updateChart();
    //   }
    // });
  }

  /**
   * Create Line Chart
   * @param data // from API
   * Step:
   * 1: create width and height
   * 2: append svg
   * 3: append g to svg
   * 4: initialize the X axis
   * 5: initialize the Y axis
   * 6: create tooltip and set opacity = 0
   * 7: create Grid X AxisX
   * 8: create Grid Y AxisY
   * 9: create g Path
   * 10: create Rect area to hover and show tooltip
   * 11: update data for line chart
   * 12: double click to comeback
   */
  createLineChart(initData: { id: string; containerWidth: number; containerHeight: number }): any {
    // create width and height
    this.isFirstCreateChart = false;
    this.id = initData.id;
    this.width = initData.containerWidth - this.margin.left - this.margin.right;
    this.height = initData.containerHeight - this.margin.top - this.margin.bottom;

    this.createSizeZoomMapping();

    // append svg
    this.svg = d3
      .select(`#${initData.id}`)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    // append g to svg
    this.g = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .attr('width', this.width);

    // Create tooltip and set opacity = 0
    this.tooltip = d3
      .select(`#${initData.id}`)
      .append('div')
      .attr('class', 'line-chart__tooltip')
      .style('opacity', 0)
      .style('background-color', 'white')
      .style('border-width', '1px')
      .style('border-radius', '5px')
      .style('padding', '10px 20px')
      .style('border', 'none')
      .style('height', 'fit-content')
      .style('position', 'absolute')
      .style('box-shadow', 'rgba(0, 0, 0, 0.24) 0px 3px 8px');

    // Create Grid X AxisX
    // this.gridX = this.g
    //   .append('g')
    //   .attr('class', 'grid')
    //   .style('stroke-dasharray', '3, 3')
    //   .attr('transform', 'translate(0,' + this.height + ')')
    //   .style('opacity', '0.5');

    // Create Grid Y AxisY
    this.gridY = this.g
      .append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '3,3')
      .style('opacity', '0.5');

    // Initialize axis after grid
    // Initialize the X axis
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.xAxis = this.g
      .append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'x');

    // Initialize the Y axis
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.yAxis = this.g.append('g');

    // Create g Path
    this.gPath = this.g.append('g').attr('clip-path', 'url(#clip)');

    // Create Rect area to hover and show tooltip
    this.rect = this.g
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('opacity', 0);

    // get duration of video
    this.videoChartService.duration.subscribe(res => {
      this.duration = res;
      this.x = this.xScale.domain([this.domainStart, this.domainEnd]);
      // this.gridX.call(
      //   this.makeXGridlines(this.x)
      //     .tickSize(-this.height)
      //     .tickFormat('')
      // );
      if (this.data && this.data.length) {
        this.updateChart();
      }
    });
    // update data for line chart
    if (this.data && this.data.length) {
      this.updateChart();
    }
    this.g
      .append('svg:clipPath')
      .attr('id', 'clip')
      .append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', 0);

    // double click to comeback
    this.svg.on('dblclick', () => {
      this.extent = undefined;
      this.updateChart();
    });

    this.g
      .append('rect')
      .attr('class', 'line-division')
      .attr('transform', `translate(${this.xScale(this.currentTime)}, 0)`)
      .attr('height', this.height)
      .attr('width', 2)
      .attr('fill', '#42989B');
  }

  // update Data
  updateChart(isTransition = false, resizeLeftSize = false, widthGanntChart?: number): void {
    // create zoom
    // this.createZoom(this.data);
    this.domainStart = this.currentTime - this.sizeZoomMapping.startTimeToMiddleTimeRange[this.kZoom];
    this.domainEnd = this.domainStart + this.sizeZoomMapping.timeRange[this.kZoom];
    if (widthGanntChart && widthGanntChart > 0) {
      widthGanntChart = widthGanntChart - this.margin.left - this.margin.right;
      this.svg = d3
        .select(`#${this.id}`)
        .select('svg')
        .attr('width', widthGanntChart + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom);

      // append g to svg
      this.g = this.svg
        .select('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
        .attr('width', widthGanntChart);

      this.rect = this.g
        .select('rect')
        .attr('width', widthGanntChart)
        .attr('height', this.height)
        .attr('opacity', 0);

      d3.select("#clip").select('rect').attr('width', widthGanntChart);

      this.xScale = d3.scaleLinear().range([0, widthGanntChart]);
      this.width = widthGanntChart;
    }

    if (resizeLeftSize) {
      // append g to svg
      this.g.attr('transform', `translate(${this.margin.left},${this.margin.top})`);
      this.xScale.range([0, this.width]);
      this.svg.select('rect.line-division').attr('transform', `translate(${this.xScale(this.currentTime)}, 12)`);
    }
    let t = d3
      .transition()
      .duration(0)
      .ease(d3.easeLinear);
    this.x = this.xScale.domain([this.domainStart, this.domainEnd]);

    if (isTransition) {
      t = d3
        .transition()
        .duration(1000 / this.speed)
        .ease(d3.easeLinear);
    }

    // domain of y
    const y = this.yScale.domain([0, 105]);
    this.gridY.call(
      this.makeYGridlines(y)
        .tickSize(-this.width)
        .tickFormat('')
    );
    this.gridY.select('path.domain').style('stroke', 'none');
    // this.gridX.select('path.domain').style('stroke', 'none');
    // add axis X
    this.xAxis.transition(t).call(
      d3
        .axisBottom(this.xScale)
        .tickFormat(i => this.dateUtil.secondsToTime(i))
        .ticks(8)
    );

    this.xAxis.selectAll('text').each(function (this, d) {
      d3.select(this).classed('noselect', true);
      if (d < 0) {
        this.remove();
      }
    });

    this.yAxis.call(d3.axisLeft(this.yScale));

    // Open here for CR: Show 0-50-100 at YAxis of line chart
    this.yAxis.selectAll('text').each(function (this, d) {
      d3.select(this).classed('noselect', true);
      if (d < 0 || d % 50) {
        this.remove();
      }
    });

    this.lines = this.gPath.selectAll('path').data(this.data);
    this.lines.exit().remove();
    this.lines
      .enter()
      .append('path')
      .attr('stroke-width', '1.3')
      .attr('fill', 'none')
      .merge(this.lines)
      .attr('id', d => `line-${d.name}`)
      .attr('stroke', d => d.color)
      .datum(d => d.data)
      .transition(t)
      .attr(
        'd',
        d3
          .line()
          .x(d => this.xScale(d.time))
          .y(d => this.yScale(d.percent))
      );
    const gCircles = this.g.selectAll('g.g-circle').data(this.data);
    gCircles
      .enter()
      .append('g')
      .attr('class', 'g-circle')
      .attr('clip-path', 'url(#clip)')
      .merge(gCircles)
      .attr('id', d => {
        if (!!d.color) {
          return `g-circle-${d.color.replace('#', '')}`;
        } else {
          return;
        }
      });
      if (this.paddingLeftXscale) {
        this.gPath.attr('transform', `translate(${this.paddingLeftXscale},0)`);
        gCircles.attr('transform', `translate(${this.paddingLeftXscale},0)`);
      }
      gCircles.exit().remove();

    if (this.data && this.data.length) {
      for (const line of this.data) {
        this.drawCircle(line.data, line.color, t);
      }
    }

    this.g.select('rect.line-division').attr('transform', `translate(${this.xScale(this.currentTime)}, 0)`);
  }

  handleDataChange(newData: any) {
    this.data = newData;
    if (!this.isFirstCreateChart) {
      this.updateChart();
    }
  }

  // function to create x grid
  makeXGridlines(x): any {
    return d3.axisBottom(x).ticks(5);
  }

  // function to create y grid
  makeYGridlines(y): any {
    return d3.axisLeft(y).ticks(3);
  }

  // function to find with s
  findValueLine(time: number, data: any): any {
    const index = data[0].data.findIndex(d => d.time === time);
    return data.map(dataItem => {
      return { name: dataItem.name, color: dataItem.color, value: dataItem.data[index].value };
    });
  }

  // find max value
  findMaxvalue(data: any): any {
    const a = data.map(e => {
      const max = Math.max.apply(
        Math,
        e.data.map(o => {
          return o.value;
        })
      );
      return max;
    });
    return Math.max.apply(null, a);
  }

  // function to format tooltip
  formatTooltip(listDataAtTime: { name: string; color: string; value: number }[]): any {
    return listDataAtTime.map(data => this.makeTooltipRow(data)).join('');
  }

  makeTooltipRow(data: { name: string; color: string; value: number }) {
    return `<div class='tooltip__row'>
    <span class='tooltip__color d-inline-block' style='background-color: ${data.color
      }; width: 15px; height: 10px'></span> ${data.name}: ${data.value}
    </div>`;
  }

  drawCircle(data: any[], color: string, translation: any) {
    if (!!color) {
      const circles = this.g
        .select(`g.g-circle#g-circle-${color.replace('#', '')}`)
        .selectAll('circle')
        .data(data);
      circles
        .enter()
        .append('circle')
        .attr('class', 'line-circle')
        .attr('r', 3)
        .on('mouseover', (d, i, nodes) => {
          const cordinate = d3.mouse(nodes[i]);
          // show tooltip
          this.tooltip
            .style('opacity', 1)
            .html(() => {
              return `<div class="tooltip__row">Time: ${this.dateUtil.secondsToTime(d.time)}</div>
            ${this.findValueLine(d.time, this.data)
                  .map(row => this.makeTooltipRow(row))
                  .join('')}`;
            })
            .style('left', (_, __, node) => {
              const tooltipWidth = node[0].clientWidth;
              if (cordinate[0] + 10 > tooltipWidth) {
                return `${-tooltipWidth - 20 + cordinate[0] + this.margin.left}px`;
              } else {
                return `${20 + cordinate[0] + this.margin.left}px`;
              }
            })
            .style('top', `-70px`);
        })
        .on('mouseout', () => {
          this.tooltip.style('left', '-1000px').style('opacity', 0);
        })
        .merge(circles)
        .transition(translation)
        .attr('cx', d => this.xScale(d.time))
        .attr('cy', d => this.yScale(d.percent))
        .attr('fill', color);
    }
  }

  leftResize(newLeftMargin: number) {
    this.width = this.width + this.margin.left - newLeftMargin;
    this.margin.left = newLeftMargin;
    this.updateChart(false, true);
  }

  clearTransition() {
    d3.selectAll('*').interrupt();
  }

  setDomainStart(value: number) {
    this.domainStart = value;
  }

  setDomainEnd(value: number) {
    this.domainEnd = value;
  }

  setCurrentTime(value: number) {
    this.currentTime = value;
  }

  setTimeRange(value: number) {
    this.timeRange = value;
    this.startTimeToMiddleTimeRange = this.timeRange / 2;
    this.createSizeZoomMapping();
  }

  setStartTimeToMiddleTimeRange(value: number) {
    this.currentTime = this.currentTime + value - this.sizeZoomMapping.startTimeToMiddleTimeRange[this.kZoom];
    this.startTimeToMiddleTimeRange = value * this.kZoom;
    this.createSizeZoomMapping();
  }

  setLineSpeed(value: number) {
    this.speed = value;
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

  changePaddingLeftXscale(value: number) {
    this.paddingLeftXscale = value;
  }
}
