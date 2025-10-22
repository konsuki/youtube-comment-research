// app/ga/page.tsx
'use client'; 

import { useState, useEffect, useMemo, useCallback } from 'react';
import MazeGrid from '@/components/ga/MazeGrid';
import { START_POS, Coordinate } from '@/constants/maze';
import { POPULATION_SIZE, CHROMOSOME_LENGTH } from '@/constants/ga';
import { 
    Chromosome, 
    generateInitialPopulation, 
    simulateAgentMovement,
    SimulationResult,
    calculateFitness
} from '@/utils/gaFunctions';

// アニメーション速度 (ミリ秒)
const ANIMATION_SPEED_MS = 150; 

export default function GAPage() {
  const [population, setPopulation] = useState<Chromosome[]>([]);
  const [generation, setGeneration] = useState(0);
  
  // アニメーション関連の状態
  const [simulationPath, setSimulationPath] = useState<Coordinate[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulationRunning, setSimulationRunning] = useState(false);
  
  // エージェントの現在の位置 (アニメーション中に動く)
  const agentPos: Coordinate = simulationPath[currentStepIndex] || START_POS;

  // 初回ロード時に初期集団を生成
  useEffect(() => {
    const initialPop = generateInitialPopulation();
    setPopulation(initialPop);
    setGeneration(1);
    
    // 動作確認のため、最初の個体をシミュレーションする
    if (initialPop.length > 0) {
        const firstChromosome = initialPop[1];
        const result = simulateAgentMovement(firstChromosome);
        setSimulationPath(result.path);
    }
  }, []);

  // アニメーション実行ロジック
  useEffect(() => {
    if (!simulationRunning || simulationPath.length === 0) return;

    // パスを最後まで辿ったらリセット
    if (currentStepIndex >= simulationPath.length - 1) {
      setSimulationRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
    }, ANIMATION_SPEED_MS);

    return () => clearTimeout(timer); // クリーンアップ
  }, [simulationRunning, currentStepIndex, simulationPath]);

  const startSimulation = useCallback(() => {
    if (simulationPath.length > 0) {
      setCurrentStepIndex(0);
      setSimulationRunning(true);
    }
  }, [simulationPath]);

  // 最初の個体に関する情報
  const firstChromosome = population[0];
  const firstIndividualResult: SimulationResult | null = firstChromosome 
    ? simulateAgentMovement(firstChromosome) : null;
    
  const firstIndividualFitness = firstIndividualResult 
    ? calculateFitness(firstIndividualResult) : 0;


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
        GA 迷路ソルバー (初期集団確認)
      </h1>

      <div className="flex space-x-12">
        {/* 迷路表示エリア */}
        <div className="flex-shrink-0">
          <h2 className="text-xl font-semibold mb-3 text-center">迷路マップ</h2>
          <MazeGrid agentPosition={agentPos} />
          
          <button 
            onClick={startSimulation}
            disabled={simulationRunning || simulationPath.length === 0}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {simulationRunning ? '実行中...' : 'シミュレーション開始'}
          </button>
          
          <p className="mt-2 text-sm text-center text-gray-600">
            {simulationRunning ? `ステップ: ${currentStepIndex}/${simulationPath.length - 1}` : '準備完了'}
          </p>
        </div>

        {/* GA情報表示エリア */}
        <div className="w-96 bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">初期集団 情報</h2>
          
          <div className="space-y-3 text-lg">
            <p><strong>世代:</strong> <span className="font-mono text-blue-600">{generation}</span></p>
            <p><strong>集団サイズ:</strong> <span className="font-mono">{POPULATION_SIZE}</span></p>
            <p><strong>染色体長:</strong> <span className="font-mono">{CHROMOSOME_LENGTH}</span> ビット</p>
          </div>
          
          {firstIndividualResult && (
            <div className="mt-6 border-t pt-3">
              <h3 className="text-xl font-semibold mb-2">最優秀（仮）個体</h3>
              <p><strong>適応度:</strong> <span className="font-bold text-green-700">{firstIndividualFitness.toFixed(2)}</span></p>
              <p><strong>最終位置:</strong> ({firstIndividualResult.finalPosition.y}, {firstIndividualResult.finalPosition.x})</p>
              <p><strong>ゴール到達:</strong> {firstIndividualResult.reachedGoal ? '✅ YES' : '❌ NO'}</p>
              <p><strong>実行ステップ数:</strong> {firstIndividualResult.stepsTaken}</p>

              <h4 className="mt-3 text-md font-medium">行動パターン (一部)</h4>
              <div className="bg-gray-100 p-3 rounded text-xs break-all font-mono">
                🧬 {firstChromosome.slice(0, 50).join('')}...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}