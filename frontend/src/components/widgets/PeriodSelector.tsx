'use client';

import React from 'react';
import { Period } from '@/lib/api/gold';

const PERIODS: { value: Period; label: string }[] = [
  { value: '1d', label: '1일' },
  { value: '1w', label: '1주' },
  { value: '1m', label: '1달' },
  { value: '1y', label: '1년' },
  { value: '3y', label: '3년' },
  { value: '5y', label: '5년' },
];

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PeriodSelector = React.memo(({ value, onChange }: PeriodSelectorProps) => {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          className={`period-btn ${value === p.value ? 'active' : ''}`}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
});

PeriodSelector.displayName = 'PeriodSelector';

export default PeriodSelector;
