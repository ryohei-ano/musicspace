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
              // Safari対応の強化された動画設定
              video.muted = true;
              video.defaultMuted = true;
              video.playsInline = true;
              video.loop = true;
              video.autoplay = false; // 明示的にfalse
              video.controls = false;
              video.preload = 'auto'; // Safariでは'auto'が効果的
              
              // Safari特有の属性設定
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              video.setAttribute('muted', 'true');
              video.setAttribute('autoplay', 'false');
              video.setAttribute('x-webkit-airplay', 'deny');
              
              // Safari用のスタイル設定
              video.style.objectFit = 'cover';
              video.style.width = '100%';
              video.style.height = '100%';
              
              let playAttempted = false;
              
              // より積極的な再生試行関数
              const tryPlay = async () => {
                if (playAttempted) return;
                playAttempted = true;
                
                try {
                  // Safari用の準備チェック
                  if (video.readyState >= 2 && video.videoWidth > 0) {
                    video.currentTime = 0;
                    const playPromise = video.play();
                    
                    if (playPromise !== undefined) {
                      await playPromise;
                      console.log('Background video playing successfully');
                    }
                  } else {
                    playAttempted = false; // 再試行を許可
                  }
                } catch (error) {
                  console.warn('Background video autoplay failed:', error);
                  playAttempted = false; // 再試行を許可
                  
                  // ユーザーインタラクション後に再生を試行
                  const handleUserInteraction = async () => {
                    try {
                      if (video.paused) {
                        await video.play();
                        console.log('Background video started after user interaction');
                        
                        // 成功したらリスナーを削除
                        document.removeEventListener('touchstart', handleUserInteraction);
                        document.removeEventListener('touchend', handleUserInteraction);
                        document.removeEventListener('click', handleUserInteraction);
                        document.removeEventListener('keydown', handleUserInteraction);
                        document.removeEventListener('mousedown', handleUserInteraction);
                      }
                    } catch (e) {
                      console.warn('Video play after interaction failed:', e);
                    }
                  };
                  
                  // 複数のイベントタイプでリッスン
                  document.addEventListener('touchstart', handleUserInteraction, { passive: true });
                  document.addEventListener('touchend', handleUserInteraction, { passive: true });
                  document.addEventListener('click', handleUserInteraction, { passive: true });
                  document.addEventListener('keydown', handleUserInteraction, { passive: true });
                  document.addEventListener('mousedown', handleUserInteraction, { passive: true });
                }
              };
              
              // 複数のイベントで再生を試行
              const handleLoadedData = () => {
                console.log('Video loaded data');
                setTimeout(tryPlay, 100); // 少し遅延
              };
              
              const handleCanPlay = () => {
                console.log('Video can play');
                setTimeout(tryPlay, 50);
              };
              
              const handleLoadedMetadata = () => {
                console.log('Video metadata loaded');
                tryPlay();
              };
              
              // イベントリスナーを追加
              video.addEventListener('loadeddata', handleLoadedData);
              video.addEventListener('loadedmetadata', handleLoadedMetadata);
              video.addEventListener('canplay', handleCanPlay);
              video.addEventListener('canplaythrough', tryPlay);
              
              // 即座に状態をチェック
              if (video.readyState >= 2) {
                setTimeout(tryPlay, 200);
              }
            }
          }}
          muted
          loop
          playsInline
          preload="auto"
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
          <svg 
            width="64" 
            height="38" 
            viewBox="0 0 362 218" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-auto sm:h-16"
            aria-label="POCARI Logo"
          >
            <g clipPath="url(#clip0_676_14764)">
              <path d="M361.588 147.35V212.3C353.558 213.23 345.548 214.72 337.498 215.54C282.898 221.12 232.098 215.89 179.978 199.32C122.008 180.89 74.1978 150.64 11.1278 150.62C9.97782 150.62 -0.00217999 150.88 0.00782001 150.32C20.2078 145.34 40.6478 140.18 61.4478 138.14C126.938 131.73 183.878 157.44 247.628 159.81C285.998 161.24 324.328 155.53 361.588 147.34V147.35Z" fill="white"/>
              <path d="M79.5819 63.4519L89.5919 103.512L100.392 63.4219L117.412 63.5119L127.742 103.512L136.952 63.4519H152.112L136.362 118.072L120.962 118.162L108.532 75.9019L96.8419 118.072L80.7319 118.052L64.4219 63.4519H79.5819Z" fill="white"/>
              <path d="M49.8028 78.6099H35.1928C34.9028 78.6099 35.4528 75.0899 33.3128 73.1799C26.2428 66.8799 14.4128 77.7599 25.2428 82.8799C33.2828 86.6799 47.8828 86.3499 51.0628 96.5799C54.2028 106.69 48.5128 115.25 38.7228 118.14C24.9028 122.23 4.87282 118.6 4.88282 100.81H19.4928C18.2328 110.14 32.7528 113.76 36.1228 105.81C40.2928 95.9899 21.2028 94.9999 15.3228 92.2499C4.21282 87.0599 3.07282 73.5399 13.0228 66.4699C23.6328 58.9399 51.0528 60.9699 49.7928 78.6199L49.8028 78.6099Z" fill="white"/>
              <path d="M205.7 63.4514V72.6514H183.24C183.18 72.6514 182.43 73.4014 182.43 73.4614V84.5614H204.08V94.3014H182.43V107.831H206.79V118.111H167.82V63.4414H205.71L205.7 63.4514Z" fill="white"/>
              <path d="M189.998 17.4415H175.658C175.158 17.4415 173.728 11.6715 168.928 10.6515C153.398 7.33152 152.098 32.8915 157.518 42.0915C162.328 50.2615 174.608 48.0815 175.938 38.5615H190.548C190.688 57.8515 163.318 61.1615 150.318 53.0815C136.198 44.3115 136.978 15.9415 149.408 5.81152C161.718 -4.22848 188.848 -1.77847 190.008 17.4515L189.998 17.4415Z" fill="white"/>
              <path d="M332.362 63.4492V73.7392H315.042V118.119H300.422V73.7392H283.102V63.4492H332.362Z" fill="white"/>
              <path d="M361.59 1.19922H346.43V55.8692H361.59V1.19922Z" fill="white"/>
              <path d="M312.867 28.7986C312.457 27.2086 314.457 27.7186 315.697 27.0386C321.637 23.8186 322.707 18.1286 322.057 11.7586C321.297 4.3086 314.327 1.8086 307.717 1.19859C297.657 0.268595 286.257 1.88859 276.047 1.19859V55.8686H291.207V34.7586H302.307C307.827 34.7586 305.227 52.8586 309.347 55.8686H324.237C318.587 47.2986 324.567 32.8886 312.867 28.7986ZM302.317 24.4786H291.217V10.9486H302.857C304.437 10.9486 306.247 12.5686 306.927 13.3786C309.967 16.9586 307.727 24.4486 302.317 24.4886V24.4786Z" fill="white"/>
              <path d="M91.9062 0.279588C74.0062 2.05959 66.2762 15.9196 67.6662 32.8596C70.2362 64.0996 114.616 64.7696 120.556 37.0496C125.046 16.0996 115.086 -2.02041 91.9062 0.279588ZM90.5462 46.2496C78.4862 41.6496 79.4462 12.5296 91.8662 9.98959C113.056 5.65959 111.046 54.0796 90.5462 46.2496Z" fill="white"/>
              <path d="M258.488 63.9808C258.068 63.4408 257.478 63.5008 256.878 63.4308C254.078 63.1008 246.068 63.0808 243.288 63.4308C242.628 63.5108 242.198 63.3908 241.688 64.0008C241.288 64.4808 239.508 69.3008 238.988 70.5108C232.308 86.0308 226.918 102.141 219.998 117.581C219.518 117.911 220.508 118.681 220.578 118.681H233.028C234.798 117.231 236.528 107.871 237.978 107.391L261.118 107.281C261.728 107.451 263.908 117.661 265.508 118.681H280.398L258.488 63.9908V63.9808ZM241.418 98.0908L249.798 74.8108L257.648 98.0908H241.408H241.418Z" fill="white"/>
              <path d="M239.546 1.16016L223.646 1.29016L201.906 55.8702H215.166L219.296 45.1202C222.266 45.4002 242.426 44.3802 243.096 45.3702L247.096 55.8802H262.526L239.546 1.16016ZM223.016 35.3102L231.406 11.4902L239.796 35.3102H223.016Z" fill="white"/>
              <path d="M47.6491 5.78922C44.8891 3.02922 39.3491 1.19922 34.9191 1.19922H7.03906V55.8692H22.1991V35.2992H36.5391C39.9191 35.2992 44.6191 33.0292 46.1891 31.9592C53.4891 26.9892 53.8591 11.9992 47.6491 5.78922ZM35.6891 23.6192C34.4791 24.8292 31.8591 25.5592 30.5891 25.5592H22.1991V10.9492H32.7591C37.5291 10.9492 39.0891 20.2192 35.6891 23.6192Z" fill="white"/>
            </g>
            <defs>
              <clipPath id="clip0_676_14764">
                <rect width="361.59" height="217.7" fill="white"/>
              </clipPath>
            </defs>
          </svg>
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
