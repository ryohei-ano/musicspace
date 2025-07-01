'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import { supabase } from '@/lib/supabase';
import MemoryText, { Theme } from './MemoryText';
import VideoPlane from './VideoPlane';
import DraggableThemeButton from './DraggableThemeButton';

interface Memory {
  id: number;
  memory: string;
  created_at: string;
  memory_id: string;
}

// 大量のテキストが重ならないように3D座標を生成する関数
const generateRandomPosition = (index: number): [number, number, number] => {
  // 複数の層に分けて配置
  const itemsPerLayer = 10; // 各層に10個
  const currentLayer = Math.floor(index / itemsPerLayer);
  const indexInLayer = index % itemsPerLayer;
  
  // 各層の基本半径（カメラから見えやすいように調整）
  const baseRadius = 8 + (currentLayer * 6); // 8, 14, 20, 26, 32...
  
  // フィボナッチ螺旋を使用して均等分布
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  const theta = indexInLayer * goldenAngle;
  const phi = Math.acos(1 - 2 * (indexInLayer + 0.5) / itemsPerLayer);
  
  // 球面座標から直交座標への変換
  const x = baseRadius * Math.sin(phi) * Math.cos(theta);
  const y = baseRadius * Math.cos(phi);
  const z = baseRadius * Math.sin(phi) * Math.sin(theta);
  
  // Y座標を調整（カメラの初期位置[0,0,30]から見て被らないように）
  const adjustedY = y * 0.3 + (Math.random() - 0.5) * 4; // Y座標をさらに圧縮
  
  // Z座標を調整（カメラの前方により多く配置）
  const adjustedZ = z * 0.7 + (Math.random() - 0.5) * 8; // Z軸方向の範囲を狭める
  
  // 追加のランダム性（重複を避けるため）
  const randomOffset = 1.0;
  const offsetX = (Math.random() - 0.5) * randomOffset;
  const offsetY = (Math.random() - 0.5) * randomOffset;
  const offsetZ = (Math.random() - 0.5) * randomOffset;
  
  return [x + offsetX, adjustedY + offsetY, adjustedZ + offsetZ];
};

// ローディング表示コンポーネント
function LoadingText({ progress, theme }: { progress: number; theme: Theme }) {
  // プログレスに基づいてバーの幅を計算
  const barWidth = (progress / 100) * 3.6; // 最大3.6の幅
  const barPosition = -1.8 + (barWidth / 2); // 左端から開始

  return (
    <group position={[0, 0, 0]}>
      {/* Loading text */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.5}
        color={theme.textColor}
        anchorX="center"
        anchorY="middle"
      >
        Loading...
      </Text>
      
      {/* Loading bar background (outer border) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.4, 0.1]} />
        <meshBasicMaterial color={theme.textColor} />
      </mesh>
      
      {/* Loading bar background (inner) - transparent */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[3.8, 0.3, 0.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Loading bar fill - animated */}
      {barWidth > 0 && (
        <mesh position={[barPosition, 0, 0.1]}>
          <boxGeometry args={[barWidth, 0.2, 0.1]} />
          <meshBasicMaterial color={theme.textColor} />
        </mesh>
      )}
      
      {/* Progress segments (8-bit style) */}
      {Array.from({ length: 10 }, (_, i) => {
        const segmentProgress = (progress - i * 10) / 10;
        const segmentOpacity = Math.max(0, Math.min(1, segmentProgress));
        const segmentX = -1.6 + (i * 0.36);
        
        return segmentOpacity > 0 ? (
          <mesh key={i} position={[segmentX, 0, 0.15]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshBasicMaterial 
              color={theme.textColor} 
              transparent 
              opacity={segmentOpacity}
            />
          </mesh>
        ) : null;
      })}
    </group>
  );
}

// 動画専用の配置関数（さらに散らばった配置、固定位置）
const generateVideoPosition = (index: number): [number, number, number] => {
  // シード値を使って固定位置を生成（再読込時も同じ位置）
  const seed = index * 12345;
  const random1 = Math.sin(seed) * 10000;
  const random2 = Math.sin(seed * 1.1) * 10000;
  const random3 = Math.sin(seed * 1.2) * 10000;
  const seededRandom1 = random1 - Math.floor(random1);
  const seededRandom2 = random2 - Math.floor(random2);
  const seededRandom3 = random3 - Math.floor(random3);
  
  // より散らばった配置
  const itemsPerLayer = 4; // 各層に4個（さらに散らばらせる）
  const currentLayer = Math.floor(index / itemsPerLayer);
  const indexInLayer = index % itemsPerLayer;
  
  // さらに広い範囲に配置
  const baseRadius = 4 + (currentLayer * 6); // 4, 10, 16, 22...
  
  // フィボナッチ螺旋を使用して均等分布
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  const theta = indexInLayer * goldenAngle;
  const phi = Math.acos(1 - 2 * (indexInLayer + 0.5) / itemsPerLayer);
  
  // 球面座標から直交座標への変換
  const x = baseRadius * Math.sin(phi) * Math.cos(theta);
  const y = baseRadius * Math.cos(phi);
  const z = baseRadius * Math.sin(phi) * Math.sin(theta);
  
  // Y座標を調整（さらに縦方向に散らばらせる）
  const adjustedY = y * 0.6 + (seededRandom1 - 0.5) * 6;
  
  // Z座標を調整（前後にさらに散らばらせる）
  const adjustedZ = z * 1.0 + (seededRandom2 - 0.5) * 8;
  
  // 追加のランダム性を増加（固定シード使用）
  const randomOffset = 2.0;
  const offsetX = (seededRandom3 - 0.5) * randomOffset;
  const offsetY = (seededRandom1 - 0.5) * randomOffset;
  const offsetZ = (seededRandom2 - 0.5) * randomOffset;
  
  return [x + offsetX, adjustedY + offsetY, adjustedZ + offsetZ];
};

// 動画ファイルのリスト
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

// テーマ定義
const themes: Theme[] = [
  {
    name: 'ポカリブルー',
    backgroundColor: '#265CAC',
    textColor: '#ffffff'
  },
  {
    name: '蛍光緑',
    backgroundColor: '#00ff00',
    textColor: '#000000'
  },
  {
    name: 'ホワイト',
    backgroundColor: '#ffffff',
    textColor: '#000000'
  },
  {
    name: 'ブラック',
    backgroundColor: '#000000',
    textColor: '#ffffff'
  }
];

// シーンの内容
function SceneContent({ currentTheme }: { currentTheme: Theme }) {
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [displayedMemories, setDisplayedMemories] = useState<Memory[]>([]);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 15秒以内かどうかを判定する関数
  const isWithinFifteenSeconds = (createdAt: string) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInSeconds = (now.getTime() - postTime.getTime()) / 1000;
    return diffInSeconds <= 15;
  };

  // 最新投稿用の特別な位置を生成（重ならないように円形配置）
  const generateLatestPosition = (index: number, total: number): [number, number, number] => {
    const radius = 8;
    const angle = (index * Math.PI * 2) / Math.max(total, 1);
    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.5,
      10 + index * 2
    ];
  };

  // ランダムにメモリを選択する関数（表示件数を適度に調整）
  const selectRandomMemories = (memories: Memory[], count: number = 50) => {
    if (memories.length === 0) return [];
    
    // 表示数を50件に調整
    const result: Memory[] = [];
    for (let i = 0; i < Math.min(count, memories.length * 2); i++) {
      const randomIndex = Math.floor(Math.random() * memories.length);
      result.push(memories[randomIndex]);
    }
    return result;
  };

  // ローディングプログレスを管理
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10; // 10%ずつ増加（約0.5秒で完了）
      });
    }, 50); // 50ms間隔

    return () => clearInterval(progressInterval);
  }, []);

  // メモリデータを取得
  useEffect(() => {
    let isMounted = true;
    
    const fetchMemories = async () => {
      try {
        const response = await fetch('/api/get-memories');
        if (!response.ok) {
          throw new Error('Failed to fetch memories');
        }
        const data = await response.json();
        
        if (isMounted) {
          setAllMemories(data);
          
          // ランダムに選択したメモリを表示
          const randomMemories = selectRandomMemories(data);
          setDisplayedMemories(randomMemories);
          
          // アニメーションを再開始するためにキーを更新
          setRefreshKey(prev => prev + 1);
        }
      } catch (err) {
        console.error('API error:', err);
        if (isMounted) {
          setError('Failed to load memories');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // ローディングプログレスが100%になったら実際のデータを取得
    if (loadingProgress >= 100) {
      setTimeout(() => {
        fetchMemories();
      }, 300);
    }

    return () => {
      isMounted = false;
    };
  }, [loadingProgress]);

  // Supabaseリアルタイム購読を別のuseEffectに分離
  useEffect(() => {
    // Supabaseリアルタイム購読
    const channel = supabase
      .channel('memories-3d')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          console.log('New memory received in 3D scene:', payload.new);
          // 新しいメモリを全メモリリストに追加
          const newMemory = payload.new as Memory;
          
          // 新しいメモリを最新メモリリストに追加
          setRecentMemories(prev => [...prev, newMemory]);
          
            setAllMemories(prev => {
              const updated = [...prev, newMemory];
              // 新しいランダム選択を実行（最新メモリ以外）- 件数を50に調整
              const randomMemories = selectRandomMemories(updated, 50);
              setDisplayedMemories(randomMemories);
              setRefreshKey(prev => prev + 1);
              return updated;
            });
          
          // 15秒後に最新メモリを通常の位置に移動
          setTimeout(() => {
            setRecentMemories(prev => prev.filter(memory => memory.id !== newMemory.id));
            setRefreshKey(prev => prev + 1);
          }, 15000); // 15秒 = 15000ms
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // 空の依存関係配列

  // 15秒ごとのランダム表示を別のuseEffectに分離
  useEffect(() => {
    const interval = setInterval(() => {
      if (allMemories.length > 0) {
        const randomMemories = selectRandomMemories(allMemories);
        setDisplayedMemories(randomMemories);
        setRefreshKey(prev => prev + 1);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [allMemories]); // allMemoriesが変更された時のみ実行

  // 15秒経過した最新投稿を自動的にクリーンアップ
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentMemories(prev => {
        const filtered = prev.filter(memory => isWithinFifteenSeconds(memory.created_at));
        if (filtered.length !== prev.length) {
          setRefreshKey(prev => prev + 1);
        }
        return filtered;
      });
    }, 5000); // 5秒ごとにチェック

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <LoadingText progress={loadingProgress} theme={currentTheme} />;
  }

  if (error) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.8}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
      >
        Error: {error}
      </Text>
    );
  }

  if (displayedMemories.length === 0) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.8}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        No memories found
      </Text>
    );
  }

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.3} />
      
      {/* ポイントライト */}
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* 星空背景（白背景時は非表示） */}
      {currentTheme.backgroundColor !== '#ffffff' && (
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
      )}
      
      {/* 最新のメモリをカメラに一番近い位置に表示 */}
      {recentMemories.map((memory, index) => (
        <MemoryText
          key={`recent-${memory.id}-${refreshKey}`}
          memory={memory}
          position={generateLatestPosition(index, recentMemories.length)}
          delay={0}
          scale={2.0} // より大きく表示
          isLatest={true} // 最新の投稿として緑色で表示
          theme={currentTheme}
        />
      ))}
      
      {/* メモリテキストを3D空間に配置 */}
      {displayedMemories.map((memory: Memory, index: number) => (
        <MemoryText
          key={`${memory.id}-${index}-${refreshKey}`} // idとindexを使って識別
          memory={memory}
          position={generateRandomPosition(index)}
          delay={index * 50} // 50msずつずらしてアニメーション開始（高速化）
          theme={currentTheme}
        />
      ))}
      
      {/* 動画を3D空間にランダム配置（12個全て表示） */}
      {videoFiles.map((videoSrc, index) => (
        <VideoPlane
          key={`video-${index}`}
          videoSrc={videoSrc}
          position={generateVideoPosition(index)}
          delay={index * 300} // 0.3秒ずつ段階的に表示
          scale={0.8} // サイズを小さくしてパフォーマンス向上
        />
      ))}
      
      {/* カメラコントロール */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.8}
        rotateSpeed={0.4}
        minDistance={5}
        maxDistance={100}
      />
    </>
  );
}

export default function ThreeMemoryScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  // 現在のテーマを取得
  const currentTheme = themes[currentThemeIndex];

  // テーマ切り替え関数
  const switchTheme = () => {
    const nextIndex = (currentThemeIndex + 1) % themes.length;
    setCurrentThemeIndex(nextIndex);
    // ローカルストレージに保存
    localStorage.setItem('themeIndex', nextIndex.toString());
    // カスタムイベントを発火してspace/page.tsxに通知
    const event = new CustomEvent('themeChanged', {
      detail: { themeIndex: nextIndex }
    });
    window.dispatchEvent(event);
  };

  // ローカルストレージからテーマを復元（ログイン中のみ）
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth === '1') {
      // ログイン中の場合のみテーマを復元
      const savedThemeIndex = localStorage.getItem('themeIndex');
      if (savedThemeIndex) {
        const index = parseInt(savedThemeIndex, 10);
        if (index >= 0 && index < themes.length) {
          setCurrentThemeIndex(index);
        }
      }
    } else {
      // 未ログインの場合はデフォルトテーマ（青）にリセット
      setCurrentThemeIndex(0);
      localStorage.removeItem('themeIndex');
    }

    // テーマ変更イベントを監視（space/page.tsxからの変更を受信）
    const handleThemeChange = (e: CustomEvent) => {
      const newThemeIndex = e.detail.themeIndex;
      if (newThemeIndex >= 0 && newThemeIndex < themes.length) {
        setCurrentThemeIndex(newThemeIndex);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  // スクリーンショット機能
  const takeScreenshot = useCallback(async () => {
    setIsScreenshotMode(true);
    
    // オーバーレイ要素が表示されるまで少し待つ
    setTimeout(async () => {
      try {
        // Three.jsのcanvasを直接取得してスクリーンショット
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas not found');
        }

        // Three.jsのシーンをより広い範囲でレンダリング
        // カメラの位置を一時的に調整してより広い範囲を撮影
        const originalCanvas = canvas;
        const gl = originalCanvas.getContext('webgl2') || originalCanvas.getContext('webgl');
        
        if (!gl) {
          throw new Error('WebGL context not found');
        }

        // 新しいcanvasを作成してより高解像度でレンダリング
        const screenshotCanvas = document.createElement('canvas');
        const screenshotSize = 2048; // 高解像度
        screenshotCanvas.width = screenshotSize;
        screenshotCanvas.height = screenshotSize;
        
        // Three.jsのレンダラーを一時的に新しいcanvasに切り替え
        const renderer = (window as unknown as Record<string, unknown>).__threeRenderer as {
          getSize: (target: { x: number; y: number }) => { x: number; y: number };
          setSize: (width: number, height: number, updateStyle: boolean) => void;
          render: (scene: unknown, camera: unknown) => void;
          domElement: HTMLCanvasElement;
        };
        if (renderer) {
          // 元のサイズを保存
          const originalSize = renderer.getSize({ x: 0, y: 0 });
          
          // レンダラーのサイズを変更
          renderer.setSize(screenshotSize, screenshotSize, false);
          
          // カメラの設定を調整（縦方向により広い範囲を撮影）
          const camera = (window as unknown as Record<string, unknown>).__threeCamera as {
            fov: number;
            position: { x: number; y: number; z: number; clone: () => { x: number; y: number; z: number }; copy: (pos: { x: number; y: number; z: number }) => void; set: (x: number, y: number, z: number) => void };
            aspect: number;
            updateProjectionMatrix: () => void;
          };
          if (camera) {
            const originalFov = camera.fov;
            const originalPosition = camera.position.clone();
            const originalAspect = camera.aspect;
            
            // 3:4の縦長比率に合わせてカメラのアスペクト比を調整
            camera.aspect = 3 / 4; // 縦長のアスペクト比
            
            // より広い視野角と遠い位置に設定（縦方向を重視）
            camera.fov = 120; // さらに広角（縦方向により多くのオブジェクトを含める）
            camera.position.set(0, 0, 80); // さらに遠くから撮影
            camera.updateProjectionMatrix();
            
            // レンダリング実行
            renderer.render((window as unknown as Record<string, unknown>).__threeScene, camera);
            
            // スクリーンショット用のデータURLを取得
            const dataURL = renderer.domElement.toDataURL('image/png', 1.0);
            
            // カメラとレンダラーを元に戻す
            camera.fov = originalFov;
            camera.position.copy(originalPosition);
            camera.aspect = originalAspect; // アスペクト比も復元
            camera.updateProjectionMatrix();
            renderer.setSize(originalSize.x, originalSize.y, false);
            
            // 通常のスクリーンショット処理を続行
            await processScreenshot(dataURL);
          } else {
            // フォールバック: 通常のcanvasからスクリーンショット
            const dataURL = originalCanvas.toDataURL('image/png', 1.0);
            await processScreenshot(dataURL);
          }
        } else {
          // フォールバック: 通常のcanvasからスクリーンショット
          const dataURL = originalCanvas.toDataURL('image/png', 1.0);
          await processScreenshot(dataURL);
        }
      } catch (error) {
        console.error('Failed to take screenshot:', error);
        // エラー時もUIを再表示
        setIsScreenshotMode(false);
        alert(`スクリーンショットの撮影に失敗しました。エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 500);
  }, [currentTheme]);

  // スクリーンショット処理の共通部分
  const processScreenshot = useCallback(async (dataURL: string) => {
    try {
      // 新しいcanvasを作成してオーバーレイ要素を合成
      const compositeCanvas = document.createElement('canvas');
      const ctx = compositeCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // インスタストーリーズのような縦長の3:4（縦長）でcanvasサイズを設定（2倍解像度）
      const aspectRatio = 3 / 4; // 縦長の比率
      const baseHeight = 2400; // 高解像度の基準高さ（2倍）
      compositeCanvas.width = baseHeight * aspectRatio; // 1800px (3:4比率)
      compositeCanvas.height = baseHeight;

      // 背景色を現在のテーマに設定
      ctx.fillStyle = currentTheme.backgroundColor;
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

      // Three.jsの画像を描画
      const img = new Image();
      img.onload = () => {
        // 元の画像のアスペクト比を保持しながら縦長canvasに描画
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = compositeCanvas.width / compositeCanvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspectRatio > canvasAspectRatio) {
          // 画像が横長の場合、幅を基準にして高さを調整
          drawWidth = compositeCanvas.width;
          drawHeight = compositeCanvas.width / imgAspectRatio;
          drawX = 0;
          drawY = (compositeCanvas.height - drawHeight) / 2;
        } else {
          // 画像が縦長の場合、高さを基準にして幅を調整
          drawHeight = compositeCanvas.height;
          drawWidth = compositeCanvas.height * imgAspectRatio;
          drawX = (compositeCanvas.width - drawWidth) / 2;
          drawY = 0;
        }
        
        // アスペクト比を保持して描画
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // SVGロゴを描画（テーマ色に対応）
        const svgString = `
          <svg width="128" height="77" viewBox="0 0 362 218" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_676_14764)">
              <path d="M361.588 147.35V212.3C353.558 213.23 345.548 214.72 337.498 215.54C282.898 221.12 232.098 215.89 179.978 199.32C122.008 180.89 74.1978 150.64 11.1278 150.62C9.97782 150.62 -0.00217999 150.88 0.00782001 150.32C20.2078 145.34 40.6478 140.18 61.4478 138.14C126.938 131.73 183.878 157.44 247.628 159.81C285.998 161.24 324.328 155.53 361.588 147.34V147.35Z" fill="${currentTheme.textColor}"/>
              <path d="M79.5819 63.4519L89.5919 103.512L100.392 63.4219L117.412 63.5119L127.742 103.512L136.952 63.4519H152.112L136.362 118.072L120.962 118.162L108.532 75.9019L96.8419 118.072L80.7319 118.052L64.4219 63.4519H79.5819Z" fill="${currentTheme.textColor}"/>
              <path d="M49.8028 78.6099H35.1928C34.9028 78.6099 35.4528 75.0899 33.3128 73.1799C26.2428 66.8799 14.4128 77.7599 25.2428 82.8799C33.2828 86.6799 47.8828 86.3499 51.0628 96.5799C54.2028 106.69 48.5128 115.25 38.7228 118.14C24.9028 122.23 4.87282 118.6 4.88282 100.81H19.4928C18.2328 110.14 32.7528 113.76 36.1228 105.81C40.2928 95.9899 21.2028 94.9999 15.3228 92.2499C4.21282 87.0599 3.07282 73.5399 13.0228 66.4699C23.6328 58.9399 51.0528 60.9699 49.7928 78.6199L49.8028 78.6099Z" fill="${currentTheme.textColor}"/>
              <path d="M205.7 63.4514V72.6514H183.24C183.18 72.6514 182.43 73.4014 182.43 73.4614V84.5614H204.08V94.3014H182.43V107.831H206.79V118.111H167.82V63.4414H205.71L205.7 63.4514Z" fill="${currentTheme.textColor}"/>
              <path d="M189.998 17.4415H175.658C175.158 17.4415 173.728 11.6715 168.928 10.6515C153.398 7.33152 152.098 32.8915 157.518 42.0915C162.328 50.2615 174.608 48.0815 175.938 38.5615H190.548C190.688 57.8515 163.318 61.1615 150.318 53.0815C136.198 44.3115 136.978 15.9415 149.408 5.81152C161.718 -4.22848 188.848 -1.77847 190.008 17.4515L189.998 17.4415Z" fill="${currentTheme.textColor}"/>
              <path d="M332.362 63.4492V73.7392H315.042V118.119H300.422V73.7392H283.102V63.4492H332.362Z" fill="${currentTheme.textColor}"/>
              <path d="M361.59 1.19922H346.43V55.8692H361.59V1.19922Z" fill="${currentTheme.textColor}"/>
              <path d="M312.867 28.7986C312.457 27.2086 314.457 27.7186 315.697 27.0386C321.637 23.8186 322.707 18.1286 322.057 11.7586C321.297 4.3086 314.327 1.8086 307.717 1.19859C297.657 0.268595 286.257 1.88859 276.047 1.19859V55.8686H291.207V34.7586H302.307C307.827 34.7586 305.227 52.8586 309.347 55.8686H324.237C318.587 47.2986 324.567 32.8886 312.867 28.7986ZM302.317 24.4786H291.217V10.9486H302.857C304.437 10.9486 306.247 12.5686 306.927 13.3786C309.967 16.9586 307.727 24.4486 302.317 24.4886V24.4786Z" fill="${currentTheme.textColor}"/>
              <path d="M91.9062 0.279588C74.0062 2.05959 66.2762 15.9196 67.6662 32.8596C70.2362 64.0996 114.616 64.7696 120.556 37.0496C125.046 16.0996 115.086 -2.02041 91.9062 0.279588ZM90.5462 46.2496C78.4862 41.6496 79.4462 12.5296 91.8662 9.98959C113.056 5.65959 111.046 54.0796 90.5462 46.2496Z" fill="${currentTheme.textColor}"/>
              <path d="M258.488 63.9808C258.068 63.4408 257.478 63.5008 256.878 63.4308C254.078 63.1008 246.068 63.0808 243.288 63.4308C242.628 63.5108 242.198 63.3908 241.688 64.0008C241.288 64.4808 239.508 69.3008 238.988 70.5108C232.308 86.0308 226.918 102.141 219.998 117.581C219.518 117.911 220.508 118.681 220.578 118.681H233.028C234.798 117.231 236.528 107.871 237.978 107.391L261.118 107.281C261.728 107.451 263.908 117.661 265.508 118.681H280.398L258.488 63.9908V63.9808ZM241.418 98.0908L249.798 74.8108L257.648 98.0908H241.408H241.418Z" fill="${currentTheme.textColor}"/>
              <path d="M239.546 1.16016L223.646 1.29016L201.906 55.8702H215.166L219.296 45.1202C222.266 45.4002 242.426 44.3802 243.096 45.3702L247.096 55.8802H262.526L239.546 1.16016ZM223.016 35.3102L231.406 11.4902L239.796 35.3102H223.016Z" fill="${currentTheme.textColor}"/>
              <path d="M47.6491 5.78922C44.8891 3.02922 39.3491 1.19922 34.9191 1.19922H7.03906V55.8692H22.1991V35.2992H36.5391C39.9191 35.2992 44.6191 33.0292 46.1891 31.9592C53.4891 26.9892 53.8591 11.9992 47.6491 5.78922ZM35.6891 23.6192C34.4791 24.8292 31.8591 25.5592 30.5891 25.5592H22.1991V10.9492H32.7591C37.5291 10.9492 39.0891 20.2192 35.6891 23.6192Z" fill="${currentTheme.textColor}"/>
            </g>
            <defs>
              <clipPath id="clip0_676_14764">
                <rect width="361.59" height="217.7" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        `;
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const logo = new Image();
        logo.onload = () => {
          ctx.drawImage(logo, 32, 32, 128, 77); // SVGのアスペクト比に合わせて調整
          URL.revokeObjectURL(svgUrl); // メモリリークを防ぐ

          // ハッシュタグを描画（高解像度対応、テーマ色に対応）
          ctx.fillStyle = currentTheme.textColor;
          ctx.font = 'bold 36px Arial, sans-serif'; // フォントサイズ2倍
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('#青春はバグだ。', compositeCanvas.width - 32, compositeCanvas.height - 32); // マージンも2倍

          // 最終的なデータURLを取得
          const finalDataURL = compositeCanvas.toDataURL('image/png', 1.0);
          
          // UIを先に再表示
          setIsScreenshotMode(false);
          
          // 保存確認アラート
          const shouldSave = window.confirm('スクリーンショットを保存しますか？');
          
          if (shouldSave) {
            // ダウンロード用のリンクを作成
            const link = document.createElement('a');
            link.download = `pocari_screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            link.href = finalDataURL;
            
            // ダウンロードを実行
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Screenshot saved successfully');
          } else {
            console.log('Screenshot cancelled by user');
          }
        };
        logo.onerror = () => {
          console.warn('SVG Logo failed to load, proceeding without logo');
          URL.revokeObjectURL(svgUrl);
          
          // ハッシュタグのみ描画（高解像度対応、テーマ色に対応）
          ctx.fillStyle = currentTheme.textColor;
          ctx.font = 'bold 36px Arial, sans-serif'; // フォントサイズ2倍
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('#青春はバグだ。', compositeCanvas.width - 32, compositeCanvas.height - 32); // マージンも2倍

          const finalDataURL = compositeCanvas.toDataURL('image/png', 1.0);
          setIsScreenshotMode(false);
          
          const shouldSave = window.confirm('スクリーンショットを保存しますか？');
          if (shouldSave) {
            const link = document.createElement('a');
            link.download = `pocari_screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            link.href = finalDataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('Screenshot saved successfully (without logo)');
          }
        };
        logo.src = svgUrl;
      };
      img.onerror = () => {
        throw new Error('Failed to load Three.js canvas image');
      };
      img.src = dataURL;
      
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      // エラー時もUIを再表示
      setIsScreenshotMode(false);
      alert(`スクリーンショットの撮影に失敗しました。エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [currentTheme]);

  // モバイル動画再生のためのユーザーインタラクションハンドラー
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // すべての動画要素を取得して再生を試行
        const videos = document.querySelectorAll('video');
        videos.forEach(async (video) => {
          try {
            if (video.paused) {
              await video.play();
              console.log('Video started after user interaction');
            }
          } catch (error) {
            console.warn('Video play after interaction failed:', error);
          }
        });
        
        // カスタムイベントを発火して VideoPlane コンポーネントに通知
        const event = new CustomEvent('userInteractionDetected');
        window.dispatchEvent(event);
      }
    };

    // 様々なユーザーインタラクションイベントをリッスン
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, handleUserInteraction, { 
        once: false, 
        passive: true 
      });
    });

    return () => {
      interactionEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleUserInteraction);
      });
    };
  }, [userInteracted]);

  // スクリーンショットイベントリスナー
  useEffect(() => {
    const handleScreenshot = () => {
      takeScreenshot();
    };

    window.addEventListener('takeScreenshot', handleScreenshot);
    
    return () => {
      window.removeEventListener('takeScreenshot', handleScreenshot);
    };
  }, [takeScreenshot]); // takeScreenshotを依存関係に追加

  return (
    <div className="w-full h-screen" style={{ backgroundColor: currentTheme.backgroundColor }}>
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, 20],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true // スクリーンショットのために必要
        }}
      >
        <Suspense fallback={<LoadingText progress={0} theme={currentTheme} />}>
          <SceneContent currentTheme={currentTheme} />
        </Suspense>
      </Canvas>
      

      {/* スクリーンショット用ハッシュタグ（スクリーンショット時のみ表示） */}
      {isScreenshotMode && (
        <div 
          className="fixed bottom-4 right-4 text-lg font-bold"
          style={{ 
            zIndex: 10000,
            fontFamily: 'MS Sans Serif, sans-serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            color: currentTheme.textColor
          }}
        >
          #青春はバグだ。
        </div>
      )}
      

      {/* 操作説明（スクリーンショット時は非表示） */}
      {!isScreenshotMode && (
        <div 
          className="fixed bottom-2 right-2 text-xs pointer-events-none"
          style={{ color: currentTheme.textColor }}
        >
          <p className="hidden sm:block">ドラッグ: 回転 | ホイール: ズーム | 右クリック + ドラッグ: パン</p>
          <p className="sm:hidden">タッチ: 回転 | ピンチ: ズーム | 2本指ドラッグ: パン</p>
        </div>
      )}
    </div>
  );
}
