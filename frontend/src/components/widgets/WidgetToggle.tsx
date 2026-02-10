'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PanelRight } from 'lucide-react';

interface WidgetToggleProps {
  onClick: () => void;
}

export default function WidgetToggle({ onClick }: WidgetToggleProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 px-5 rounded-full shadow-lg bg-slate-800 hover:bg-slate-700 text-white gap-2"
    >
      <PanelRight className="h-5 w-5" />
      <span className="text-sm font-medium">위젯 관리</span>
    </Button>
  );
}
