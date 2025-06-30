'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TerminalStream from '@/components/TerminalStream';
import ThreeMemoryScene from '@/components/ThreeMemoryScene';

export default function Page() {
  const router = useRouter();
  const [showTerminal, setShowTerminal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // 認証状態をチェック
    const auth = localStorage.getItem('auth');
    if (auth !== '1') {
      // 未認証の場合はloginページにリダイレクト
      router.push('/login');
      return;
    }

    // ビューポートの高さを監視（キーボード表示対応）
    const updateViewportHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    // 初期設定
    updateViewportHeight();

    // ビューポート変更の監視
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // 認証済みユーザーのみ表示
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3Dメモリシーン */}
      <ThreeMemoryScene />
      
      {/* ロゴ（左上） */}
      <div 
        className="fixed top-4 left-4 sm:absolute" 
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={() => router.push('/')}
          className="block hover:opacity-80 transition-opacity duration-150 active:scale-95 cursor-pointer"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999
          }}
        >
          <img 
            src="/image/pocari_logo.webp" 
            alt="POCARI Logo" 
            className="h-12 w-auto sm:h-16"
          />
        </button>
      </div>
      
      {/* コントロールパネル（スマホで固定表示） */}
      <div 
        className="fixed top-4 right-4 flex flex-col gap-3 sm:gap-2 sm:absolute" 
        style={{ zIndex: 9999 }}
      >
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout clicked');
            logout();
          }}
          className="px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto cursor-pointer"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            background: '#c0c0c0',
            border: '2px outset #c0c0c0',
            color: '#000000',
            borderRadius: 0
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.border = '2px inset #c0c0c0';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.border = '2px outset #c0c0c0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '2px outset #c0c0c0';
          }}
        >
          ログアウト
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTerminal(!showTerminal);
          }}
          className="px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-auto whitespace-nowrap cursor-pointer"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            background: '#c0c0c0',
            border: '2px outset #c0c0c0',
            color: '#000000',
            borderRadius: 0
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.border = '2px inset #c0c0c0';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.border = '2px outset #c0c0c0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '2px inset #c0c0c0';
          }}
        >
          {showTerminal ? 'ターミナルを隠す' : 'ターミナルを表示'}
        </button>
      </div>
      
      {/* ターミナル（キーボード対応） */}
      {showTerminal && (
        <div 
          className="fixed left-2 right-2 sm:absolute sm:left-4 sm:right-4 sm:bottom-4 max-h-48 sm:max-h-64 z-10"
          style={{
            bottom: viewportHeight > 0 && viewportHeight < window.innerHeight 
              ? `${window.innerHeight - viewportHeight + 16}px` 
              : '16px'
          }}
        >
          <TerminalStream onClose={() => setShowTerminal(false)} />
        </div>
      )}
    </div>
  );
}
