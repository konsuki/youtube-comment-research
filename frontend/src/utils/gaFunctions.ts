import {
  POPULATION_SIZE,
  CHROMOSOME_LENGTH,
  BITS_PER_ACTION,
  DIRECTION_MAP,
  ACTIONS_PER_AGENT,
  MUTATION_RATE
} from '@/constants/ga';
import { Coordinate, MAZE_MAP, MAZE_HEIGHT, MAZE_WIDTH, GOAL_POS, START_POS, MazeTile } from '@/constants/maze';

// ------------------------------------------------------------------
// 型定義
// ------------------------------------------------------------------

// 染色体（個体）の型定義: 0と1の配列
export type Chromosome = number[]; 

// シミュレーション結果の型定義
export type SimulationResult = {
  finalPosition: Coordinate;
  stepsTaken: number;
  path: Coordinate[]; // 実際に通った経路 (アニメーション用)
  reachedGoal: boolean;
};

// 評価済み個体の型定義: 染色体、適応度、結果をまとめたもの
export type EvaluatedIndividual = {
  chromosome: Chromosome;
  fitness: number;
  result: SimulationResult;
};

// ------------------------------------------------------------------
// 2. 初期集団の生成 (generateInitialPopulation)
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
      // Math.round(Math.random()) は 0または1を生成する一般的な方法
      chromosome.push(Math.round(Math.random())); 
    }
    
    population.push(chromosome);
  }

  return population;
}

// ------------------------------------------------------------------
// ヘルパー関数: 距離計算
// ------------------------------------------------------------------

/**
 * マンハッタン距離を計算するヘルパー関数
 */
function calculateManhattanDistance(pos1: Coordinate, pos2: Coordinate): number {
  return Math.abs(pos1.y - pos2.y) + Math.abs(pos1.x - pos2.x);
}


// ------------------------------------------------------------------
// 3. 迷路探索シミュレーション (simulateAgentMovement)
// ------------------------------------------------------------------

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
    if (actionBits.length < BITS_PER_ACTION) break; 

    const actionKey = actionBits.join(''); // "00", "01", "10", "11"

    const direction = DIRECTION_MAP[actionKey];
    if (!direction) continue; 

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
// 3. 適応度計算 (calculateFitness)
// ------------------------------------------------------------------

/**
 * 個体の適応度を計算する（ゴールからの距離に基づく）
 */
export function calculateFitness(result: SimulationResult): number {
    // 1. ゴールからの距離を計算
    const distance = calculateManhattanDistance(result.finalPosition, GOAL_POS);
    
    // 2. 適応度設定: 迷路の最大距離の目安
    const MAX_DISTANCE = MAZE_HEIGHT + MAZE_WIDTH; 
    
    if (result.reachedGoal) {
        // ゴールに到達した場合
        // 少ないステップで到達した経路を優遇するために、ステップ数によるボーナスを与える
        // 適応度 = MAX_DISTANCE の倍 + (最大行動回数 - 実際に使ったステップ数)
        // 最初の MAX_DISTANCE * 3 は、非到達個体より常に高くなるようにするため
        return (MAX_DISTANCE * 3) + (ACTIONS_PER_AGENT - result.stepsTaken);
    }
    
    // ゴールに到達しなかった場合
    // 距離が近いほど高得点 (MAX_DISTANCE から距離を引く)
    // distance が 0 に近いほど、適応度が MAX_DISTANCE に近づく。
    return MAX_DISTANCE - distance;
}


// ------------------------------------------------------------------
// 3. 集団の評価 (evaluatePopulation)
// ------------------------------------------------------------------

/**
 * 集団内のすべての個体を評価し、適応度が高い順にソートして返す。
 * @param population 評価対象の集団
 * @returns EvaluatedIndividual[]: 評価済みの個体リスト
 */
export function evaluatePopulation(population: Chromosome[]): EvaluatedIndividual[] {
  const evaluatedPopulation: EvaluatedIndividual[] = [];

  for (const chromosome of population) {
    const result = simulateAgentMovement(chromosome);
    const fitness = calculateFitness(result);
    
    evaluatedPopulation.push({
      chromosome,
      fitness,
      result,
    });
  }

  // 適応度が高い順にソート (降順)
  evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);

  return evaluatedPopulation;
}

// ------------------------------------------------------------------
// 4. 選択 (Selection) - ルーレット選択
// ------------------------------------------------------------------

/**
 * 適応度に基づいて、次の世代の親となる個体を選択する (ルーレット選択)。
 * @param evaluatedPopulation 評価済みの集団リスト (ソートされている必要はない)
 * @returns Chromosome: 選択された親個体
 */
export function selection(evaluatedPopulation: EvaluatedIndividual[]): Chromosome {
  // 全個体の適応度の合計を計算
  const totalFitness = evaluatedPopulation.reduce((sum, individual) => sum + individual.fitness, 0);

  // 適応度がゼロのケースの対応（全て適応度が0の場合、全員均等に選択）
  if (totalFitness <= 0) {
    const randomIndex = Math.floor(Math.random() * evaluatedPopulation.length);
    return evaluatedPopulation[randomIndex].chromosome;
  }

  // ルーレットを回す位置をランダムに決定 (0 から totalFitness の間)
  const selectionPoint = Math.random() * totalFitness;
  let currentSum = 0;

  // ルーレットをシミュレーションし、選択点に達した個体を返す
  for (const individual of evaluatedPopulation) {
    currentSum += individual.fitness;
    if (currentSum >= selectionPoint) {
      return individual.chromosome;
    }
  }

  // 万が一ループを抜けた場合は最後の個体を返す（計算誤差対策）
  return evaluatedPopulation[evaluatedPopulation.length - 1].chromosome;
}

// ------------------------------------------------------------------
// 5. 交叉 (Crossover) - 一点交叉
// ------------------------------------------------------------------

/**
 * 2つの親から一点交叉により2つの子を生成する。
 * @param parent1 親1の染色体
 * @param parent2 親2の染色体
 * @returns [Chromosome, Chromosome]: 生成された子1と子2の染色体
 */
export function crossover(parent1: Chromosome, parent2: Chromosome): [Chromosome, Chromosome] {
  // 交叉点をランダムに選択 (1 から CHROMOSOME_LENGTH - 1 の間)
  // 交叉点が 0 や CHROMOSOME_LENGTH になると、親と子が同一になってしまうため避ける
  // CHROMOSOME_LENGTH = 100 の場合、1から99
  const crossoverPoint = Math.floor(Math.random() * (CHROMOSOME_LENGTH - 1)) + 1;

  // JavaScriptの配列操作を使って、遺伝子を交換して子を生成
  // 親1の先頭 + 親2の末尾 = 子1
  const child1 = [
    ...parent1.slice(0, crossoverPoint),
    ...parent2.slice(crossoverPoint),
  ];
  
  // 親2の先頭 + 親1の末尾 = 子2
  const child2 = [
    ...parent2.slice(0, crossoverPoint),
    ...parent1.slice(crossoverPoint),
  ];

  return [child1, child2];
}

// ------------------------------------------------------------------
// 6. 突然変異 (Mutation)
// ------------------------------------------------------------------

/**
 * 突然変異の確率に基づいて、個体の遺伝子をランダムに反転させる。
 * @param chromosome 変異させる染色体
 * @param mutationRate 突然変異の確率 (0.05など)
 * @returns Chromosome: 変異後の染色体
 */
export function mutate(chromosome: Chromosome, mutationRate: number): Chromosome {
  const mutatedChromosome: Chromosome = [...chromosome];

  for (let i = 0; i < CHROMOSOME_LENGTH; i++) {
    if (Math.random() < mutationRate) {
      // 突然変異が発生した場合
      // 0なら1に、1なら0に反転させる (1 - x を利用)
      mutatedChromosome[i] = 1 - mutatedChromosome[i];
    }
  }
      
  return mutatedChromosome;
}

// ------------------------------------------------------------------
// 7. 次世代の形成
// ------------------------------------------------------------------

/**
 * 既存の評価済み集団から、選択、交叉、突然変異を用いて次世代集団を生成する。
 * (エリート戦略を採用)
 * @param evaluatedPopulation 評価済みの現世代集団 (適応度順にソート済み)
 * @returns Chromosome[]: 次世代の集団
 */
export function createNextGeneration(evaluatedPopulation: EvaluatedIndividual[]): Chromosome[] {
  const newPopulation: Chromosome[] = [];
  
  // 1. エリート戦略: 最も適応度の高い個体（エリート）を次世代にそのまま残す
  // evaluatedPopulationは既に適応度順にソートされているため、0番目がエリート
  if (evaluatedPopulation.length > 0) {
    newPopulation.push(evaluatedPopulation[0].chromosome);
  } else {
    // 予期せぬエラー対応
    return generateInitialPopulation(); // 集団が空の場合は、初期集団を再生成して返す
  }

  // 2. 交叉と突然変異で残りの個体を生成
  // 集団サイズに達するまでループ
  while (newPopulation.length < POPULATION_SIZE) {
    
    // --- 2a. 選択 ---
    // ルーレット選択を使って親を2つ選ぶ
    const parent1 = selection(evaluatedPopulation);
    const parent2 = selection(evaluatedPopulation);

    // --- 2b. 交叉 ---
    const [child1, child2] = crossover(parent1, parent2);

    // --- 2c. 突然変異 ---
    const mutatedChild1 = mutate(child1, MUTATION_RATE);
    const mutatedChild2 = mutate(child2, MUTATION_RATE);

    // --- 2d. 新集団に追加 ---
    newPopulation.push(mutatedChild1);
    
    // 集団サイズを超えないかチェックしながら2人目の子を追加
    if (newPopulation.length < POPULATION_SIZE) {
      newPopulation.push(mutatedChild2);
    }
  }

  return newPopulation;
}