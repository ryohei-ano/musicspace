'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 認証状態をチェック
    const auth = localStorage.getItem('auth');
    
    if (auth === '1') {
      // 認証済みの場合はspaceページにリダイレクト
      router.push('/space');
    } else {
      // 未認証の場合はloginページにリダイレクト
      router.push('/login');
    }
  }, [router]);

  // リダイレクト中は何も表示しない
  return null;
}
