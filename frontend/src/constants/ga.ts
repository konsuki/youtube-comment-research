import { MAZE_HEIGHT, MAZE_WIDTH } from './maze';

// --- 1. GA 全体パラメータ ---
export const POPULATION_SIZE = 50;  // 集団の個体数
export const MAX_GENERATIONS = 200; // 最大世代数
export const MUTATION_RATE = 0.05;  // 突然変異の確率 (5%)

// --- 2. 染色体と行動の定義 ---

// エージェントが迷路内で実行できる最大の行動回数
export const ACTIONS_PER_AGENT = 400; 

// 1行動あたり2ビットを使用するため、染色体の長さは 50 * 2 = 100
export const BITS_PER_ACTION = 2;
export const CHROMOSOME_LENGTH = ACTIONS_PER_AGENT * BITS_PER_ACTION;


// --- 3. 遺伝子（2ビット）と方向のマッピング ---
// 00=上, 01=右, 10=下, 11=左 (合理的な組み合わせとして提示)
export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

// 座標の変更量 [y, x]
export const DIRECTION_MAP: { [key: string]: { dx: number; dy: number; dir: Direction } } = {
  '00': { dy: -1, dx: 0, dir: 'UP' },    // Y座標を減らす
  '01': { dy: 0, dx: 1, dir: 'RIGHT' },  // X座標を増やす
  '10': { dy: 1, dx: 0, dir: 'DOWN' },   // Y座標を増やす
  '11': { dy: 0, dx: -1, dir: 'LEFT' },   // X座標を減らす
};