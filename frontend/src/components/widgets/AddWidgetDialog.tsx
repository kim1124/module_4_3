'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { WidgetType } from '@/lib/api/gold';
import { Widget } from '@/lib/api/widgets';

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'international_gold', label: '국제 금시세' },
  { value: 'krx_gold', label: 'KRX 금시세' },
  { value: 'kimchi_premium', label: '김치 프리미엄 현황' },
  { value: 'gold_recommendation', label: '금 매수/매도 추천' },
];

interface AddWidgetDialogProps {
  onAdd: (name: string, type: WidgetType) => void;
  // 수정 모드 (외부에서 제어)
  editWidget?: Widget | null;
  onEdit?: (id: number, name: string, type: WidgetType) => void;
  onEditCancel?: () => void;
}

export default function AddWidgetDialog({ onAdd, editWidget, onEdit, onEditCancel }: AddWidgetDialogProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<WidgetType>('international_gold');
  const [error, setError] = useState('');

  const isEditMode = !!editWidget;
  const dialogOpen = isEditMode || addOpen;

  // 수정 모드 진입 시 기존 값 채우기
  useEffect(() => {
    if (editWidget) {
      setName(editWidget.name);
      setType(editWidget.type as WidgetType);
      setError('');
    }
  }, [editWidget]);

  const handleClose = () => {
    if (isEditMode) {
      onEditCancel?.();
    } else {
      setAddOpen(false);
    }
    setName('');
    setType('international_gold');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('위젯 이름을 입력해주세요.');
      return;
    }
    setError('');

    if (isEditMode && editWidget && onEdit) {
      onEdit(editWidget.id, name.trim(), type);
    } else {
      onAdd(name.trim(), type);
    }
    setName('');
    setType('international_gold');
    if (!isEditMode) setAddOpen(false);
  };

  const handleTypeChange = (value: string) => {
    setType(value as WidgetType);
    if (!name.trim()) {
      const selected = WIDGET_TYPES.find((t) => t.value === value);
      if (selected) setName(selected.label);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) handleClose(); else if (!isEditMode) setAddOpen(true); }}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            위젯 추가
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '위젯 수정' : '새 위젯 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '위젯의 이름과 타입을 수정합니다.' : '위젯 타입을 선택하고 이름을 입력하세요.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">위젯 타입</label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="타입 선택" />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">위젯 이름</label>
            <Input
              placeholder="위젯 이름을 입력하세요"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit">{isEditMode ? '수정' : '추가'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
