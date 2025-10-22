// 迷路マップ (Y, X)
// 0: 通路, 1: 壁, S: スタート, G: ゴール
export const MAZE_MAP = [
  ['S', 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 'G'],
] as const; // as const を使用して不変であることを保証

export type MazeTile = 0 | 1 | 'S' | 'G';
export type Coordinate = { y: number; x: number };

// 迷路の次元
export const MAZE_HEIGHT = MAZE_MAP.length;
export const MAZE_WIDTH = MAZE_MAP[0].length;

// スタートとゴールの座標 (Y, X)
export const START_POS: Coordinate = { y: 0, x: 0 };
export const GOAL_POS: Coordinate = { y: MAZE_HEIGHT - 1, x: MAZE_WIDTH - 1 };