'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [backgroundVideo, setBackgroundVideo] = useState('');

  // ランダムな背景動画を選択
  useEffect(() => {
    const videoFiles = [
      '/video/01.mp4',
      '/video/02.mp4',
      '/video/03.mp4',
      '/video/04.mp4',
      '/video/05.mp4',
      '/video/06.mp4',
      '/video/07.mp4',
      '/video/08.mp4',
      '/video/09.mp4',
      '/video/10.mp4',
      '/video/11.mp4',
      '/video/12.mp4'
    ];
    
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    setBackgroundVideo(videoFiles[randomIndex]);
  }, []);

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
      className="relative flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{ 
        backgroundColor: '#265CAC',
        minHeight: '100vh',
        height: '100vh'
      }}
    >
      {/* 背景動画 */}
      {backgroundVideo && (
        <video
          ref={(video) => {
            if (video) {
              // モバイル対応の動画設定
              video.muted = true;
              video.playsInline = true;
              video.loop = true;
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('muted', 'true');
              
              // 動画の読み込み完了後に再生を試行
              const tryPlay = async () => {
                try {
                  await video.play();
                } catch (error) {
                  console.warn('Background video autoplay failed:', error);
                  // 自動再生に失敗した場合、ユーザーインタラクション後に再生
                  const handleUserInteraction = async () => {
                    try {
                      await video.play();
                      document.removeEventListener('touchstart', handleUserInteraction);
                      document.removeEventListener('click', handleUserInteraction);
                      document.removeEventListener('keydown', handleUserInteraction);
                    } catch (e) {
                      console.warn('Video play after interaction failed:', e);
                    }
                  };
                  
                  document.addEventListener('touchstart', handleUserInteraction, { once: true });
                  document.addEventListener('click', handleUserInteraction, { once: true });
                  document.addEventListener('keydown', handleUserInteraction, { once: true });
                }
              };
              
              if (video.readyState >= 3) {
                tryPlay();
              } else {
                video.addEventListener('canplay', tryPlay, { once: true });
              }
            }
          }}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}
      
      {/* 背景オーバーレイ（動画を少し暗くする） */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }}
      />
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
      {/* ロゴ（上部固定） */}
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

      {/* メインタイトル */}
      <h1 
        className="text-3xl sm:text-4xl mb-8 text-center font-bold text-white"
        style={{ 
          fontFamily: 'MS Sans Serif, sans-serif',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        青春はバグだ。
      </h1>

      {/* ログインダイアログ */}
      <div 
        className="w-full max-w-sm p-4"
        style={{
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          borderRadius: '0',
          boxShadow: 'inset -1px -1px #808080, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 9999
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
          <span className="font-bold">青春はバグだ。</span>
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
            Passcode:
          </label>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Enter your passcode"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full p-2 text-sm"
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
          </div>
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
