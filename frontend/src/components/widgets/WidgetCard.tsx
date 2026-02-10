'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Widget } from '@/lib/api/widgets';
import { Period, WidgetType, GoldPriceData, PremiumData, RecommendationData, fetchInternationalGold, fetchKrxGold, fetchKimchiPremium, fetchGoldRecommendation } from '@/lib/api/gold';
import PeriodSelector from './PeriodSelector';
import RefreshGauge from './RefreshGauge';
import GoldCandleChart from './GoldCandleChart';
import KimchiPremiumChart from './KimchiPremiumChart';
import GoldRecommendation from './GoldRecommendation';

interface WidgetCardProps {
  widget: Widget;
  onDelete: (id: number) => void;
}

const WIDGET_TYPE_LABELS: Record<string, string> = {
  international_gold: '국제 금시세 (USD/oz)',
  krx_gold: 'KRX 금시세 (KRW/g)',
  kimchi_premium: '김치 프리미엄',
  gold_recommendation: '매수/매도 추천',
  default: '기본 위젯',
};

const WidgetCard = React.memo(({ widget, onDelete }: WidgetCardProps) => {
  const [period, setPeriod] = useState<Period>((widget.config?.period as Period) || '1m');
  const [priceData, setPriceData] = useState<GoldPriceData[]>([]);
  const [premiumData, setPremiumData] = useState<PremiumData[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRecommendation = widget.type === 'gold_recommendation';

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const type = widget.type as WidgetType;
      switch (type) {
        case 'international_gold': {
          const data = await fetchInternationalGold(period);
          setPriceData(data);
          break;
        }
        case 'krx_gold': {
          const data = await fetchKrxGold(period);
          setPriceData(data);
          break;
        }
        case 'kimchi_premium': {
          const data = await fetchKimchiPremium(period);
          setPremiumData(data);
          break;
        }
        case 'gold_recommendation': {
          const data = await fetchGoldRecommendation('1m');
          setRecommendation(data);
          break;
        }
      }
    } catch (err) {
      setError('데이터를 불러올 수 없습니다');
      console.error('Widget data fetch error:', err);
    }
  }, [widget.type, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
  }, []);

  const renderContent = () => {
    if (error) {
      return <div className="flex items-center justify-center h-full text-sm text-red-400">{error}</div>;
    }

    const type = widget.type as WidgetType;
    switch (type) {
      case 'international_gold':
        return <GoldCandleChart data={priceData} currency="USD" />;
      case 'krx_gold':
        return <GoldCandleChart data={priceData} currency="KRW" />;
      case 'kimchi_premium':
        return <KimchiPremiumChart data={premiumData} />;
      case 'gold_recommendation':
        return <GoldRecommendation data={recommendation} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            위젯 타입을 선택해주세요
          </div>
        );
    }
  };

  return (
    <div className="widget-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800 truncate">
          {widget.name}
        </span>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <RefreshGauge onRefresh={fetchData} />
          <button
            onClick={() => onDelete(widget.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Period Selector (not shown for recommendation) */}
      {!isRecommendation && (
        <div className="px-3 py-1.5 border-b border-gray-50">
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </div>
      )}

      {/* Chart Content */}
      <div className="flex-1 min-h-0 p-1">
        {renderContent()}
      </div>
    </div>
  );
});

WidgetCard.displayName = 'WidgetCard';

export default WidgetCard;
