import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chromosome,
  generateInitialPopulation,
  evaluatePopulation,
  createNextGeneration,
  EvaluatedIndividual,
  simulateAgentMovement,
  SimulationResult,
} from '@/utils/gaFunctions';
import { MAX_GENERATIONS } from '@/constants/ga';
import { Coordinate } from '@/constants/maze';

// GAの状態を管理するための型
interface GAState {
  currentGeneration: number;
  isRunning: boolean;
  isFinished: boolean;
  population: Chromosome[];
  bestIndividual: EvaluatedIndividual | null;
  log: string[];
}

export const useGeneticAlgorithm = () => {
  const [gaState, setGaState] = useState<GAState>(() => ({
    currentGeneration: 0,
    isRunning: false,
    isFinished: false,
    population: [],
    bestIndividual: null,
    log: [],
  }));

  // --- 1. 初期化 ---
  useEffect(() => {
    // 最初の集団を生成してセット
    const initialPopulation = generateInitialPopulation();
    setGaState(prev => ({
      ...prev,
      population: initialPopulation,
      currentGeneration: 1, // 初期状態を第1世代とする
    }));
  }, []);
  
  // --- 2. メインの世代交代ロジック ---
  const evolve = useCallback((currentPopulation: Chromosome[], generation: number) => {
    if (generation > MAX_GENERATIONS) {
      // 最大世代数に到達したら終了
      setGaState(prev => ({
        ...prev,
        isRunning: false,
        isFinished: true,
        log: [...prev.log, `終了: 最大世代数 (${MAX_GENERATIONS}) に到達。`],
      }));
      return;
    }

    // 1. 評価
    const evaluatedPopulation = evaluatePopulation(currentPopulation);
    const best = evaluatedPopulation[0];

    // ログの更新
    const logEntry = `世代 ${generation}: 最良適応度 = ${best.fitness.toFixed(2)} (ゴール到達: ${best.result.reachedGoal ? 'Yes' : 'No'})`;
    
    // 状態の更新
    setGaState(prev => ({
        ...prev,
        bestIndividual: best,
        log: [...prev.log, logEntry],
    }));

    // 2. 収束判定
    if (best.result.reachedGoal) {
      setGaState(prev => ({
        ...prev,
        isRunning: false,
        isFinished: true,
        log: [...prev.log, `✅ 収束! 世代 ${generation} で最適解に到達しました。`],
      }));
      return;
    }

    // 3. 次世代の生成
    const nextPopulation = createNextGeneration(evaluatedPopulation);

    // 4. 世代を進める
    setGaState(prev => ({
      ...prev,
      population: nextPopulation,
      currentGeneration: generation + 1,
    }));
    
  }, []); // 依存関係は外部の定数のみ

  // --- 3. GA実行制御 ---
  const runGeneration = useCallback(() => {
    // 実行中でない、または終了している場合は何もしない
    if (!gaState.isRunning || gaState.isFinished || gaState.currentGeneration === 0) return;

    // GAのサイクルを非同期で実行
    // (JavaScriptのメインスレッドをブロックしないようsetTimeoutで処理を分割)
    setTimeout(() => {
      evolve(gaState.population, gaState.currentGeneration);
    }, 0); 
    
  }, [gaState.isRunning, gaState.isFinished, gaState.currentGeneration, gaState.population, evolve]);


  // isRunning が true の間、runGeneration を繰り返し呼び出す
  useEffect(() => {
    if (gaState.isRunning && !gaState.isFinished) {
      runGeneration();
    }
  }, [gaState.currentGeneration, gaState.isRunning, gaState.isFinished, runGeneration]);
  
  // 制御関数
  const startGA = useCallback(() => {
    setGaState(prev => ({ ...prev, isRunning: true, isFinished: false, log: [] }));
  }, []);
  
  const stopGA = useCallback(() => {
    setGaState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetGA = useCallback(() => {
    const initialPopulation = generateInitialPopulation();
    setGaState({
      currentGeneration: 1,
      isRunning: false,
      isFinished: false,
      population: initialPopulation,
      bestIndividual: null,
      log: [],
    });
  }, []);
  
  // 最良個体のシミュレーション結果を計算（アニメーション用）
  const bestPathResult: SimulationResult | null = useMemo(() => {
    if (!gaState.bestIndividual) return null;
    // Note: bestIndividual.result に既にパス情報が含まれているため、再シミュレーションは不要
    return gaState.bestIndividual.result;
  }, [gaState.bestIndividual]);

  return {
    ...gaState,
    startGA,
    stopGA,
    resetGA,
    bestPathResult,
  };
};