'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem('auth') === '1';
    if (ok) {
      router.push('/space');
      return;
    }
    setAuth(false);
  }, [router]);

  const submit = () => {
    if (pass === 'U2zhDY' || pass === 'L5zaYQ' || pass === 'w7TDkL') {
      localStorage.setItem('auth', '1');
      // 即座にリダイレクト（stateを更新せずに）
      router.push('/space');
    } else {
      alert('パスワードが間違っています');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white px-4" style={{ backgroundColor: '#265CAC' }}>
      <div className="w-full max-w-sm p-6 sm:p-8 bg-black bg-opacity-50 rounded-lg">
        <h1 className="text-xl sm:text-2xl mb-6 text-center">Login</h1>
        <input
          type="password"
          placeholder="パスワードを入力"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full p-3 sm:p-2 mb-4 bg-gray-800 text-white rounded text-base"
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button 
          onClick={submit}
          className="w-full p-3 sm:p-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors text-base font-medium"
        >
          ENTER
        </button>
      </div>
    </div>
  );
}
