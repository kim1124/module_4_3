'use client';

import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { PremiumData } from '@/lib/api/gold';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

interface KimchiPremiumChartProps {
  data: PremiumData[];
}

const KimchiPremiumChart = React.memo(({ data }: KimchiPremiumChartProps) => {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const dates = data.map((d) => d.date);
    const premiums = data.map((d) => d.premium_pct);

    return {
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: (params: any) => {
          try {
            const p = params?.[0];
            if (!p || p.dataIndex == null || !data[p.dataIndex]) return '';
            const item = data[p.dataIndex];
            return `○ ${item.date}<br/>` +
              `프리미엄: <b>${item.premium_pct.toFixed(2)}%</b><br/>` +
              `KRX 가격: ₩${item.krx_price.toLocaleString()}<br/>` +
              `국제 가격(원): ₩${item.intl_price_krw.toLocaleString()}`;
          } catch { return ''; }
        },
      },
      grid: { left: '8%', right: '4%', top: '8%', bottom: '12%' },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [
        {
          type: 'line',
          data: premiums,
          smooth: true,
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
            ]),
          },
          itemStyle: { color: '#f59e0b' },
          markLine: {
            silent: true,
            data: [{ yAxis: 0, lineStyle: { color: '#94a3b8', type: 'dashed' } }],
          },
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

KimchiPremiumChart.displayName = 'KimchiPremiumChart';

export default KimchiPremiumChart;
