'use client';

import React from 'react';
import { RecommendationData } from '@/lib/api/gold';

interface GoldRecommendationProps {
  data: RecommendationData | null;
}

const signalConfig = {
  buy: { label: '매수', className: 'signal-buy', emoji: '🟢' },
  sell: { label: '매도', className: 'signal-sell', emoji: '🔴' },
  hold: { label: '관망', className: 'signal-hold', emoji: '🟡' },
};

const GoldRecommendation = React.memo(({ data }: GoldRecommendationProps) => {
  if (!data) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">데이터를 불러오는 중...</div>;
  }

  const config = signalConfig[data.signal];

  return (
    <div className="flex flex-col h-full p-2 gap-3">
      {/* Signal badge */}
      <div className="flex items-center justify-center">
        <div className={`px-6 py-3 rounded-xl text-center font-bold text-lg ${config.className}`}>
          {config.emoji} {config.label}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-500">현재가</div>
          <div className="font-semibold">${data.current_price.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-500">변동률</div>
          <div className={`font-semibold ${data.price_change_pct >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            {data.price_change_pct >= 0 ? '+' : ''}{data.price_change_pct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-500">MA5 / MA20</div>
          <div className="font-semibold text-xs">{data.ma5.toFixed(1)} / {data.ma20.toFixed(1)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-500">김치 프리미엄</div>
          <div className="font-semibold">{data.premium_pct.toFixed(2)}%</div>
        </div>
      </div>

      {/* Reasons */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs text-gray-500 mb-1">분석 근거</div>
        <ul className="space-y-1">
          {data.reasons.map((reason, i) => (
            <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

GoldRecommendation.displayName = 'GoldRecommendation';

export default GoldRecommendation;
