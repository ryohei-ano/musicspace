'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TerminalStream from '@/components/TerminalStream';
import ThreeMemoryScene from '@/components/ThreeMemoryScene';
import { Button } from '@/components/ui/button';

export default function Page() {
  const router = useRouter();
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    // 認証状態をチェック
    const auth = localStorage.getItem('auth');
    if (auth !== '1') {
      // 未認証の場合はloginページにリダイレクト
      router.push('/login');
      return;
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // 認証済みユーザーのみ表示
  return (
    <div className="relative w-full h-screen">
      {/* 3Dメモリシーン */}
      <ThreeMemoryScene />
      
      {/* コントロールパネル */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 sm:gap-2" style={{ zIndex: 9999 }}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout clicked');
            logout();
          }}
          className="px-4 py-3 sm:px-4 sm:py-2 text-white border border-white rounded-md hover:bg-white hover:text-black transition-colors duration-150 active:scale-95 text-sm sm:text-base min-h-[44px] sm:min-h-auto"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            backgroundColor: 'transparent'
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
          className="px-4 py-3 sm:px-4 sm:py-2 text-white border border-white rounded-md hover:bg-white hover:text-black transition-colors duration-150 active:scale-95 text-sm sm:text-base min-h-[44px] sm:min-h-auto whitespace-nowrap"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            backgroundColor: 'transparent'
          }}
        >
          {showTerminal ? 'ターミナルを隠す' : 'ターミナルを表示'}
        </button>
      </div>
      
      {/* ターミナル（オプション表示） */}
      {showTerminal && (
        <div className="absolute bottom-4 left-2 right-2 sm:left-4 sm:right-4 max-h-48 sm:max-h-64 bg-black bg-opacity-90 rounded-lg p-2 sm:p-4 z-10">
          <TerminalStream />
        </div>
      )}
    </div>
  );
}
