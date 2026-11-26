import { BarChart, LineChart, TreemapChart } from 'echarts/charts';
import { AriaComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { AppChartOption } from './app-chart';

// Only the pieces the four charts use are registered: the full ECharts package is several times larger.
echarts.use([BarChart, LineChart, TreemapChart, AriaComponent, GridComponent, MarkLineComponent, TooltipComponent, SVGRenderer]);

interface ChartCanvasProps {
  option: AppChartOption;
  height: number;
  onClick?: (event: unknown) => void;
}

/** The ECharts instance. Loaded on demand by `AppChart`, so the library stays out of the first paint. */
export default function ChartCanvas({ option, height, onClick }: ChartCanvasProps) {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      opts={{ renderer: 'svg' }}
      style={{ height, width: '100%' }}
      notMerge
      onEvents={onClick ? { click: onClick } : undefined}
    />
  );
}
