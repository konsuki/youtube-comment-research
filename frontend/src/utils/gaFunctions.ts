import {
  POPULATION_SIZE,
  CHROMOSOME_LENGTH,
  BITS_PER_ACTION,
  DIRECTION_MAP,
  ACTIONS_PER_AGENT,
} from '@/constants/ga';
import { Coordinate, MAZE_MAP, MAZE_HEIGHT, MAZE_WIDTH, GOAL_POS, START_POS } from '../constants/maze';

// 染色体（個体）の型定義
export type Chromosome = number[]; // 0と1の配列

// ------------------------------------------------------------------
// 2. 初期集団の生成 (generate_initial_population)
// ------------------------------------------------------------------

/**
 * ランダムなバイナリ列で初期集団を生成する。
 * @returns Chromosome[]: 初期集団のリスト
 */
export function generateInitialPopulation(): Chromosome[] {
  const population: Chromosome[] = [];

  for (let i = 0; i < POPULATION_SIZE; i++) {
    const chromosome: Chromosome = [];
    
    // 0または1からなるランダムなリストを生成
    for (let j = 0; j < CHROMOSOME_LENGTH; j++) {
      chromosome.push(Math.round(Math.random())); // 0または1
    }
    population.push(chromosome);
  }

  return population;
}

// ------------------------------------------------------------------
// 3. 迷路探索シミュレーション (simulateAgentMovement)
// ------------------------------------------------------------------

export type SimulationResult = {
  finalPosition: Coordinate;
  stepsTaken: number;
  path: Coordinate[]; // 実際に通った経路 (アニメーション用)
  reachedGoal: boolean;
};

/**
 * 染色体に基づいて迷路探索をシミュレーションする
 * @param chromosome 実行する行動リスト
 * @returns SimulationResult: シミュレーション結果
 */
export function simulateAgentMovement(chromosome: Chromosome): SimulationResult {
  const path: Coordinate[] = [{ ...START_POS }];
  let currentPos: Coordinate = { ...START_POS };
  let reachedGoal = false;
  let stepsTaken = 0;

  // 染色体を2ビットずつ（1行動ずつ）処理
  for (let i = 0; i < CHROMOSOME_LENGTH && !reachedGoal; i += BITS_PER_ACTION) {
    stepsTaken++;
    
    // 2ビットの遺伝子を取り出す (例: [0, 1] -> "01")
    const actionBits = chromosome.slice(i, i + BITS_PER_ACTION);
    if (actionBits.length < BITS_PER_ACTION) break; // 途中でビットが尽きたら終了

    const actionKey = actionBits.join(''); // "00", "01", "10", "11"

    const direction = DIRECTION_MAP[actionKey];
    if (!direction) continue; // 不正なキーであればスキップ

    const nextY = currentPos.y + direction.dy;
    const nextX = currentPos.x + direction.dx;

    // --- 1. 範囲チェック ---
    if (nextY < 0 || nextY >= MAZE_HEIGHT || nextX < 0 || nextX >= MAZE_WIDTH) {
      // 迷路の外に出る場合、移動しない
      path.push({ ...currentPos });
      continue;
    }

    const nextTile = MAZE_MAP[nextY][nextX] as MazeTile;

    // --- 2. 壁チェック ---
    if (nextTile === 1) {
      // 壁の場合、移動しない
      path.push({ ...currentPos });
      continue;
    }

    // --- 3. 移動実行 ---
    currentPos = { y: nextY, x: nextX };
    path.push({ ...currentPos });

    // --- 4. ゴールチェック ---
    if (currentPos.y === GOAL_POS.y && currentPos.x === GOAL_POS.x) {
      reachedGoal = true;
    }
  }

  return {
    finalPosition: currentPos,
    stepsTaken: stepsTaken,
    path: path,
    reachedGoal: reachedGoal,
  };
}

// ------------------------------------------------------------------
// 4. 適応度計算 (calculateFitness) - ステップ3の後半
// ------------------------------------------------------------------

/**
 * マンハッタン距離を計算するヘルパー関数
 */
function calculateManhattanDistance(pos1: Coordinate, pos2: Coordinate): number {
  return Math.abs(pos1.y - pos2.y) + Math.abs(pos1.x - pos2.x);
}

/**
 * 個体の適応度を計算する（ゴールからの距離に基づく）
 */
export function calculateFitness(result: SimulationResult): number {
    // 1. ゴールからの距離を計算
    const distance = calculateManhattanDistance(result.finalPosition, GOAL_POS);
    
    // 2. 適応度設定
    const MAX_DISTANCE = MAZE_HEIGHT + MAZE_WIDTH; // 迷路の最大距離の目安
    
    if (result.reachedGoal) {
        // ゴールに到達した場合、距離0を意味する高い値を与える
        // さらに、少ないステップで到達した経路を優遇するために、(MAX_DISTANCE * 2) - result.stepsTaken とする
        return (MAX_DISTANCE * 2) + (ACTIONS_PER_AGENT - result.stepsTaken);
    }
    
    // ゴールに到達しなかった場合、距離が近いほど高得点 (MAX_DISTANCE から距離を引く)
    // 距離が0のときは適応度が最大となり、距離が離れるほど適応度が低くなる。
    return MAX_DISTANCE - distance;
}

// ------------------------------------------------------------------