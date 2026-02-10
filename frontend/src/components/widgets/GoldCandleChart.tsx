'use client';

import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { CandlestickChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { GoldPriceData } from '@/lib/api/gold';

echarts.use([CandlestickChart, BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface GoldCandleChartProps {
  data: GoldPriceData[];
  currency: string;
}

const GoldCandleChart = React.memo(({ data, currency }: GoldCandleChartProps) => {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const dates = data.map((d) => d.date);
    const ohlc = data.map((d) => [d.open, d.close, d.low, d.high]);
    const volumes = data.map((d) => d.volume);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        appendToBody: true,
        formatter: (params: any) => {
          try {
            if (!Array.isArray(params) || params.length === 0) return '';
            const idx = params[0]?.dataIndex;
            if (idx == null || !data[idx]) return '';
            const item = data[idx];
            const fmt = (v: number) => currency === 'KRW' ? `₩${v.toLocaleString()}` : `$${v.toLocaleString()}`;
            return `○ ${item.date}<br/>` +
              `시가: ${fmt(item.open)}<br/>` +
              `고가: ${fmt(item.high)}<br/>` +
              `저가: ${fmt(item.low)}<br/>` +
              `종가: ${fmt(item.close)}<br/>` +
              `거래량: ${item.volume.toLocaleString()}`;
          } catch { return ''; }
        },
      },
      grid: [
        { left: '8%', right: '4%', top: '8%', height: '58%' },
        { left: '8%', right: '4%', top: '72%', height: '18%' },
      ],
      xAxis: [
        { type: 'category', data: dates, gridIndex: 0, axisLabel: { fontSize: 10 } },
        { type: 'category', data: dates, gridIndex: 1, axisLabel: { show: false } },
      ],
      yAxis: [
        { scale: true, gridIndex: 0, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
        { scale: true, gridIndex: 1, axisLabel: { fontSize: 10 }, splitLine: { show: false } },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: data.length > 60 ? 70 : 0, end: 100 },
      ],
      series: [
        {
          type: 'candlestick',
          data: ohlc,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: '#ef4444',
            color0: '#3b82f6',
            borderColor: '#ef4444',
            borderColor0: '#3b82f6',
          },
        },
        {
          type: 'bar',
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: { color: '#94a3b8', opacity: 0.5 },
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">데이터를 불러오는 중...</div>;
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '100%', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
});

GoldCandleChart.displayName = 'GoldCandleChart';

export default GoldCandleChart;
