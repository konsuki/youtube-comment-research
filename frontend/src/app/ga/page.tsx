// app/ga/page.tsx
'use client'; 

import { useState, useEffect, useCallback } from 'react';
import MazeGrid from '@/components/ga/MazeGrid';
import SettingsPanel from '@/components/ga/SettingsPanel'; 
import { useGeneticAlgorithm } from '../../hooks/ga/useGeneticAlgorithm'; // GAのロジックを管理するカスタムフック
import { Coordinate } from '@/constants/maze';
import { MAX_GENERATIONS } from '@/constants/ga';

// アニメーション速度 (ミリ秒)
const ANIMATION_SPEED_MS = 100; 

export default function GAPage() {
  const {
    currentGeneration,
    isRunning,
    isFinished,
    startGA,
    stopGA,
    resetGA,
    bestIndividual,
    bestPathResult,
    log,
  } = useGeneticAlgorithm();
  
  // 新しい迷路が生成されたときにMazeGridを再描画するためのキー
  const [mazeKey, setMazeKey] = useState(0); 
  
  // SettingsPanelから呼ばれるコールバック
  const handleMazeChange = useCallback(() => {
    // グローバルな MAZE_MAP が変更されたらキーを更新し、MazeGridを強制再描画
    // このキーが変わることで、MazeGridは新しい MAZE_MAP の値を使用して描画される
    setMazeKey(prev => prev + 1); 
  }, []);
  
  // --- アニメーション制御 ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationRunning, setAnimationRunning] = useState(false);
  
  const path = bestPathResult?.path || [];
  // エージェントの位置: アニメーション中はそのステップの位置、停止中は最終位置
  const agentPos: Coordinate = path[currentStepIndex] || bestPathResult?.finalPosition || { y: -1, x: -1 };
  
  // アニメーション実行ロジック
  useEffect(() => {
    if (!animationRunning || path.length === 0) return;

    // パスを最後まで辿ったら停止
    if (currentStepIndex >= path.length - 1) {
      setAnimationRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }, ANIMATION_SPEED_MS);

    return () => clearTimeout(timer);
  }, [animationRunning, currentStepIndex, path]);

  const startAnimation = useCallback(() => {
    if (path.length > 0) {
      setCurrentStepIndex(0);
      setAnimationRunning(true);
    }
  }, [path]);

  // GAが更新された際（新しい最良個体が現れた際）、アニメーションをリセット
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [bestIndividual]);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
        GA 迷路ソルバー
      </h1>

      <div className="flex space-x-12 w-full">
        
        {/* 左: 制御パネルとログ */}
        <div className="w-1/3 flex flex-col space-y-6">
          
          {/* 設定パネル */}
          <SettingsPanel onMazeChange={handleMazeChange} />
          
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">GA 制御</h2>
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={isRunning ? stopGA : startGA}
                disabled={isFinished && !isRunning}
                className={`py-2 px-4 font-bold rounded transition ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? '停止' : isFinished ? '再実行' : '開始'}
              </button>
              <button 
                onClick={resetGA}
                className="py-2 px-4 bg-gray-300 hover:bg-gray-400 rounded transition"
              >
                リセット
              </button>
            </div>
            
            <p className="text-lg"><strong>世代:</strong> <span className="font-mono text-blue-600">{currentGeneration} / {MAX_GENERATIONS}</span></p>
            <p className="text-lg"><strong>状態:</strong> 
              {isFinished ? '✅ 完了' : isRunning ? '▶️ 実行中' : '⏸️ 待機中'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-xl flex-grow overflow-y-auto max-h-96">
            <h3 className="text-xl font-semibold mb-2">GA ログ</h3>
            <div className="space-y-1 text-sm font-mono text-gray-700">
              {/* 最新のログ10件を表示 */}
              {log.slice(-10).map((entry, index) => (
                <p key={index} className={entry.startsWith('✅') ? 'text-green-600 font-bold' : ''}>{entry}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 中央: 迷路マップとアニメーション制御 */}
        <div className="w-1/3 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-3">迷路マップ</h2>
          {/* key を設定し、迷路変更時に強制再描画 */}
          <MazeGrid key={mazeKey} agentPosition={agentPos} />
          
          <div className="mt-6 w-full p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">アニメーション制御</h3>
            <button 
              onClick={startAnimation}
              disabled={animationRunning || !bestPathResult}
              className="w-full py-2 px-4 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 disabled:bg-gray-400 transition"
            >
              {animationRunning ? '再生中...' : '最良個体のパスを再生'}
            </button>
            <p className="mt-2 text-sm text-center text-gray-600">
              ステップ: {currentStepIndex} / {path.length > 0 ? path.length - 1 : 0}
            </p>
          </div>
        </div>

        {/* 右: 最良個体情報 */}
        <div className="w-1/3 bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">最良個体情報</h2>
          {bestIndividual ? (
            <>
              <p className="text-lg"><strong>適応度:</strong> <span className="font-bold text-green-700">{bestIndividual.fitness.toFixed(2)}</span></p>
              <p className="text-lg"><strong>ゴール到達:</strong> {bestIndividual.result.reachedGoal ? '✅ YES' : '❌ NO'}</p>
              <p className="text-lg"><strong>実行ステップ:</strong> {bestIndividual.result.stepsTaken}</p>
              <p className="text-lg"><strong>最終位置:</strong> ({bestIndividual.result.finalPosition.y}, {bestIndividual.result.finalPosition.x})</p>
              
              <h4 className="mt-4 text-md font-medium border-t pt-3">行動パターン (一部)</h4>
              <div className="bg-gray-100 p-3 rounded text-xs break-all font-mono max-h-32 overflow-y-auto">
                🧬 {bestIndividual.chromosome.slice(0, 100).join('')}
              </div>
            </>
          ) : (
            <p>GAを開始してください。</p>
          )}
        </div>
      </div>
    </div>
  );
}