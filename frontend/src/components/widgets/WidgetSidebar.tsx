'use client';

import React from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import { Widget } from '@/lib/api/widgets';
import { WidgetType } from '@/lib/api/gold';
import AddWidgetDialog from './AddWidgetDialog';

const TYPE_LABELS: Record<string, string> = {
  international_gold: '국제 금시세',
  krx_gold: 'KRX 금시세',
  kimchi_premium: '김치 프리미엄',
  gold_recommendation: '매수/매도 추천',
  default: '기본',
};

interface WidgetSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: Widget[];
  onAddWidget: (name: string, type: WidgetType) => void;
  onEditWidget: (widget: Widget) => void;
  onDeleteWidget: (id: number) => void;
  onDeleteAllWidgets: () => void;
  editingWidget?: Widget | null;
  onEditSubmit?: (id: number, name: string, type: WidgetType) => void;
  onEditCancel?: () => void;
}

export default function WidgetSidebar({
  open,
  onOpenChange,
  widgets,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
  onDeleteAllWidgets,
  editingWidget,
  onEditSubmit,
  onEditCancel,
}: WidgetSidebarProps) {
  return (
    <div className={`widget-sidebar ${open ? 'open' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">위젯 관리</h2>
            <p className="text-xs text-gray-500">대시보드 위젯을 관리합니다</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add Widget */}
        <div className="mb-6">
          <AddWidgetDialog
            onAdd={onAddWidget}
            editWidget={editingWidget}
            onEdit={onEditSubmit}
            onEditCancel={onEditCancel}
          />
        </div>

        {/* Widget List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">현재 위젯 ({widgets.length})</h3>
          <div className="space-y-2">
            {widgets.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                아직 위젯이 없습니다.<br />위젯을 추가해보세요!
              </p>
            ) : (
              widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-800 truncate">{widget.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {TYPE_LABELS[widget.type] || widget.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => onEditWidget(widget)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="위젯 수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWidget(widget.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="위젯 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {widgets.length > 0 && (
            <button
              onClick={onDeleteAllWidgets}
              className="w-full mt-3 py-2 px-3 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              모든 위젯 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
