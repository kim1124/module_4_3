'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Layout } from 'react-grid-layout';
import { User } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  saveLayouts,
  Widget,
  WidgetLayoutData,
} from '@/lib/api/widgets';
import { WidgetType } from '@/lib/api/gold';
import { fetchWithAuth } from '@/lib/api/client';
import WidgetCard from '@/components/widgets/WidgetCard';
import WidgetSidebar from '@/components/widgets/WidgetSidebar';
import WidgetToggle from '@/components/widgets/WidgetToggle';

const ReactGridLayout = dynamic(() => import('react-grid-layout'), {
  ssr: false,
});

const DESKTOP_COLS = 6;
const DEFAULT_W = 3; // 50% of grid
const DEFAULT_H = 3;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const layoutRef = useRef<Layout[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);

  // Profile edit state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const cols = isMobile ? 1 : DESKTOP_COLS;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ResizeObserver로 컨테이너 너비 정확히 측정
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  useEffect(() => {
    if (user) {
      loadWidgets();
      setProfileUsername(user.username);
      setProfileEmail(user.email);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadWidgets = async () => {
    try {
      const data = await getWidgets();
      setWidgets(data);
    } catch (error) {
      console.error('Failed to load widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = useCallback(async (name: string, type: WidgetType) => {
    try {
      const cur = layoutRef.current;
      let nextX = 0;
      let nextY = 0;

      if (cur.length > 0) {
        let maxBottom = 0;
        for (const item of cur) {
          const b = item.y + item.h;
          if (b > maxBottom) maxBottom = b;
        }
        let lastEndX = 0;
        for (const item of cur) {
          if (item.y + item.h >= maxBottom - 1) {
            const endX = item.x + item.w;
            if (endX > lastEndX) lastEndX = endX;
          }
        }
        nextX = lastEndX;
        nextY = maxBottom - DEFAULT_H;
        if (nextY < 0) nextY = 0;
        if (nextX + DEFAULT_W > DESKTOP_COLS) {
          nextX = 0;
          nextY = maxBottom;
        }
      }

      const newWidget = await createWidget({
        name,
        type,
        config: { period: '1m' },
        layout: { x: nextX, y: nextY, w: DEFAULT_W, h: DEFAULT_H, i: `widget_temp_${Date.now()}` },
      });
      setWidgets((prev) => [...prev, newWidget]);
    } catch (error) {
      console.error('Failed to create widget:', error);
    }
  }, []);

  const handleDeleteWidget = useCallback(async (id: number) => {
    try {
      await deleteWidget(id);
      layoutRef.current = layoutRef.current.filter((l) => l.i !== `widget_${id}`);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  }, []);

  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  const handleEditWidget = useCallback(async (id: number, name: string, type: WidgetType) => {
    try {
      const updated = await updateWidget(id, { name, type });
      setWidgets((prev) => prev.map((w) => (w.id === id ? updated : w)));
      setEditingWidget(null);
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  }, []);

  const handleDeleteAllWidgets = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/widgets/all', { method: 'DELETE' });
      if (response.ok) {
        setWidgets([]);
        layoutRef.current = [];
      }
    } catch (error) {
      console.error('Failed to delete all widgets:', error);
    }
  }, []);

  // onLayoutChange: ref + 서버 저장만. state 업데이트 절대 없음 (무한 루프 방지)
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    layoutRef.current = newLayout;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const layoutData: WidgetLayoutData[] = newLayout.map((item) => ({
          x: item.x, y: item.y, w: item.w, h: item.h, i: item.i,
        }));
        await saveLayouts(layoutData);
      } catch (error) {
        console.error('Failed to save layouts:', error);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.refresh();
  }, [logout, router]);

  const handleProfileSave = useCallback(async () => {
    setProfileSaving(true);
    setProfileError('');
    try {
      const response = await fetchWithAuth('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileUsername,
          email: profileEmail,
          ...(newPassword && { current_password: currentPassword, new_password: newPassword }),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '수정 실패');
      }
      setCurrentPassword('');
      setNewPassword('');
      setProfileOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setProfileError(err.message || '수정 중 오류가 발생했습니다');
    } finally {
      setProfileSaving(false);
    }
  }, [profileUsername, profileEmail, currentPassword, newPassword, router]);

  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥇</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">금시세 대시보드</h1>
          <p className="text-gray-500 text-center text-sm mb-8">실시간 금 시세 모니터링 플랫폼</p>
          <div className="space-y-3">
            <a href="/login" className="block w-full py-3 px-4 text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-700 text-center transition-colors">로그인</a>
            <a href="/register" className="block w-full py-3 px-4 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 text-center transition-colors">회원가입</a>
          </div>
        </div>
      </main>
    );
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="dashboard-header px-6 py-4 sticky top-0 z-40">
        <div className="w-[90vw] max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🥇</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">금시세 대시보드</h1>
              <p className="text-xs text-slate-400">{user?.username}님, 환영합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setProfileUsername(user?.username || ''); setProfileEmail(user?.email || ''); setCurrentPassword(''); setNewPassword(''); setProfileError(''); setProfileOpen(true); }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              title="사용자 정보 수정"
            >
              <User className="h-5 w-5" />
            </button>
            <button onClick={handleLogout} className="py-2 px-4 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-colors">로그아웃</button>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="w-[90vw] max-w-[1600px] mx-auto py-4" ref={containerRef}>
        {widgets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">위젯이 없습니다</h3>
            <p className="text-sm text-gray-500">우측 하단의 &quot;위젯 관리&quot; 버튼을 클릭하여<br />금시세 위젯을 추가해보세요.</p>
          </div>
        ) : (
          <ReactGridLayout
            className="layout"
            cols={cols}
            rowHeight={160}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            isResizable
            isDraggable
            margin={[16, 16]}
            containerPadding={[0, 0]}
            compactType="vertical"
            useCSSTransforms={true}
          >
            {widgets.map((widget) => {
              const key = `widget_${widget.id}`;
              const live = layoutRef.current.find((l) => l.i === key);
              const serverW = Math.min(widget.layout.w || DEFAULT_W, DESKTOP_COLS);
              const serverX = Math.min(widget.layout.x || 0, Math.max(0, DESKTOP_COLS - serverW));
              return (
                <div
                  key={key}
                  data-grid={{
                    x: live ? live.x : serverX,
                    y: live ? live.y : (widget.layout.y || 0),
                    w: live ? live.w : serverW,
                    h: live ? live.h : (widget.layout.h || DEFAULT_H),
                    minW: 1,
                    minH: 2,
                  }}
                  className="drag-handle"
                >
                  <WidgetCard widget={widget} onDelete={handleDeleteWidget} />
                </div>
              );
            })}
          </ReactGridLayout>
        )}
      </div>

      {/* Sidebar & Toggle */}
      <WidgetSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onEditWidget={(w) => setEditingWidget(w)}
        onDeleteWidget={handleDeleteWidget}
        onDeleteAllWidgets={handleDeleteAllWidgets}
        editingWidget={editingWidget}
        onEditSubmit={handleEditWidget}
        onEditCancel={() => setEditingWidget(null)}
      />
      <WidgetToggle onClick={() => setSidebarOpen(true)} />

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProfileOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">사용자 정보 수정</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">사용자명</label>
                <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">이메일</label>
                <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">현재 비밀번호</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="변경 시에만 입력" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">새 비밀번호</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="변경 시에만 입력 (8자 이상)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
              </div>
              {profileError && <p className="text-sm text-red-500">{profileError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setProfileOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">취소</button>
                <button onClick={handleProfileSave} disabled={profileSaving} className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50">{profileSaving ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
