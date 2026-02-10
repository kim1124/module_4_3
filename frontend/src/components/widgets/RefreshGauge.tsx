'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface RefreshGaugeProps {
  intervalSeconds?: number;
  onRefresh: () => void;
}

const RefreshGauge = React.memo(({ intervalSeconds = 60, onRefresh }: RefreshGaugeProps) => {
  const [remaining, setRemaining] = useState(intervalSeconds);

  useEffect(() => {
    setRemaining(intervalSeconds);
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onRefresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds, onRefresh]);

  const handleClick = useCallback(() => {
    onRefresh();
    setRemaining(intervalSeconds);
  }, [intervalSeconds, onRefresh]);

  const progress = remaining / intervalSeconds;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Color transition: green → yellow → red
  const color = progress > 0.5 ? '#22c55e' : progress > 0.2 ? '#eab308' : '#ef4444';

  return (
    <div className="refresh-gauge" onClick={handleClick} title={`${remaining}초 후 자동 갱신 (클릭하여 즉시 갱신)`}>
      <svg viewBox="0 0 28 28" width="28" height="28">
        <circle cx="14" cy="14" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
        <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#6b7280" fontWeight="500">
          {remaining}
        </text>
      </svg>
    </div>
  );
});

RefreshGauge.displayName = 'RefreshGauge';

export default RefreshGauge;
