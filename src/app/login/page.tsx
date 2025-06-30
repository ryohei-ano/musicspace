'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [pass, setPass] = useState('');

  // ログインページでは常にパスワード入力を求める
  // useEffectでの自動リダイレクトを削除

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
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: '#265CAC' }}
    >
      {/* Film Grain / White Noise */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, rgba(255,255,255,0.008) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.006) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.004) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(255,255,255,0.005) 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, rgba(255,255,255,0.007) 0%, transparent 50%)
          `,
          backgroundSize: '2px 2px, 3px 3px, 1px 1px, 4px 4px, 2px 2px',
          animation: 'filmGrain 0.1s infinite linear',
          opacity: 0.6,
          zIndex: 1
        }}
      />

      {/* Digital Glitch */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, transparent 98%, rgba(255,0,255,0.003) 99%, transparent 100%),
            linear-gradient(90deg, transparent 97%, rgba(0,255,255,0.003) 98%, transparent 100%)
          `,
          backgroundSize: '100px 1px, 150px 1px',
          animation: 'digitalGlitch 3s infinite linear',
          zIndex: 1
        }}
      />

      <style jsx>{`
        @keyframes filmGrain {
          0% { 
            background-position: 0px 0px, 0px 0px, 0px 0px, 0px 0px, 0px 0px;
            transform: translate(0px, 0px);
          }
          10% { 
            background-position: -1px 1px, 1px -1px, 1px 1px, -1px -1px, 1px 0px;
            transform: translate(0.1px, 0px);
          }
          20% { 
            background-position: 1px 0px, -1px 1px, 0px -1px, 1px 1px, -1px 1px;
            transform: translate(-0.1px, 0px);
          }
          30% { 
            background-position: 0px -1px, 1px 0px, -1px 0px, 0px 1px, 1px -1px;
            transform: translate(0px, 0.1px);
          }
          40% { 
            background-position: -1px 0px, 0px -1px, 1px 0px, -1px 1px, 0px 1px;
            transform: translate(0px, -0.1px);
          }
          50% { 
            background-position: 1px 1px, -1px 0px, 0px 1px, 1px -1px, -1px 0px;
            transform: translate(0.1px, 0.1px);
          }
          60% { 
            background-position: 0px 1px, 1px 1px, -1px -1px, 0px 0px, 1px 1px;
            transform: translate(-0.1px, -0.1px);
          }
          70% { 
            background-position: -1px -1px, 0px 1px, 1px -1px, -1px 0px, 0px -1px;
            transform: translate(0px, 0px);
          }
          80% { 
            background-position: 1px -1px, -1px -1px, 0px 0px, 1px 0px, -1px -1px;
            transform: translate(0.1px, -0.1px);
          }
          90% { 
            background-position: 0px 0px, 1px -1px, -1px 1px, 0px -1px, 1px 0px;
            transform: translate(-0.1px, 0.1px);
          }
          100% { 
            background-position: 0px 0px, 0px 0px, 0px 0px, 0px 0px, 0px 0px;
            transform: translate(0px, 0px);
          }
        }
        
        @keyframes digitalGlitch {
          0% { background-position: 0px 0px, 0px 0px; }
          33% { background-position: 10px 0px, -5px 0px; }
          66% { background-position: -8px 0px, 12px 0px; }
          100% { background-position: 0px 0px, 0px 0px; }
        }
      `}</style>
      {/* ロゴ（左上） */}
      <div 
        className="absolute top-4 left-4" 
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

      {/* メインタイトル */}
      <h1 
        className="text-3xl sm:text-4xl mb-8 text-center font-bold text-white"
        style={{ 
          fontFamily: 'MS Sans Serif, sans-serif',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        青春は、バグだ。
      </h1>

      {/* ログインダイアログ */}
      <div 
        className="w-full max-w-sm p-4"
        style={{
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          borderRadius: '0',
          boxShadow: 'inset -1px -1px #808080, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #dfdfdf'
        }}
      >
        {/* タイトルバー */}
        <div 
          className="flex items-center justify-between px-2 py-1 mb-3 text-sm"
          style={{
            background: 'linear-gradient(90deg, #0a246a 0%, #a6caf0 100%)',
            color: 'white',
            borderBottom: '1px solid #808080'
          }}
        >
          <span className="font-bold">ログイン</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
            <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
            <div className="w-3 h-3 bg-red-500" style={{ border: '1px outset #c0c0c0' }}></div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="p-3">
          <label 
            className="block mb-2 text-sm"
            style={{ color: '#000000' }}
          >
            パスワード:
          </label>
          <input
            type="password"
            placeholder="パスワードを入力"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full p-2 mb-4 text-sm"
            style={{
              fontSize: '16px', // iOS Safari ズーム防止
              WebkitAppearance: 'none',
              borderRadius: 0,
              background: 'white',
              border: '1px inset #c0c0c0',
              color: '#000000',
              outline: 'none'
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button 
            onClick={submit}
            className="w-full p-2 text-sm font-medium cursor-pointer"
            style={{
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
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
