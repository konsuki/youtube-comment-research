// constants/maze.ts

// --------------------------------------------------
// 型定義
// --------------------------------------------------
export type MazeTile = 0 | 1 | 'S' | 'G';
export type Coordinate = { y: number; x: number };

// --------------------------------------------------
// 迷路生成ロジックの追加
// --------------------------------------------------

/**
 * 空の迷路グリッドを生成する
 */
const createEmptyGrid = (height: number, width: number): MazeTile[][] => {
    // 0で埋められた配列を生成
    return Array(height).fill(0).map(() => Array(width).fill(0)) as MazeTile[][];
};

/**
 * ランダムな壁を持つ新しい迷路を生成する (シンプル版)
 * @param height 迷路の高さ
 * @param width 迷路の幅
 * @param wallRatio 壁の密度 (0.0 から 1.0)
 */
export function generateRandomMaze(height: number, width: number, wallRatio: number = 0.3): MazeTile[][] {
    if (height < 3 || width < 3) throw new Error("Maze must be at least 3x3");

    const newMaze: MazeTile[][] = createEmptyGrid(height, width);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // スタート (0, 0) とゴール (H-1, W-1) は壁にしない
            if ((y === 0 && x === 0) || (y === height - 1 && x === width - 1)) {
                continue;
            }
            
            // ランダムに壁を配置 (1)
            if (Math.random() < wallRatio) {
                newMaze[y][x] = 1;
            }
        }
    }
    
    // スタートとゴールを設定
    newMaze[0][0] = 'S';
    newMaze[height - 1][width - 1] = 'G';

    return newMaze;
}


// --------------------------------------------------
// 迷路の状態管理 (動的な変更に対応)
// --------------------------------------------------

// 初期マップデータ (7x7)
const INITIAL_MAZE_DATA: MazeTile[][] = [
  ['S', 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 'G'],
];

// GAのロジックから参照される現在の迷路データ
export let MAZE_MAP: MazeTile[][] = INITIAL_MAZE_DATA;
export let MAZE_HEIGHT = MAZE_MAP.length;
export let MAZE_WIDTH = MAZE_MAP[0].length;

// スタートとゴールは常に角にあると仮定
export const START_POS: Coordinate = { y: 0, x: 0 };
export let GOAL_POS: Coordinate = { y: MAZE_HEIGHT - 1, x: MAZE_WIDTH - 1 };


/**
 * 迷路マップを更新し、関連する次元情報も更新する
 */
export function setMazeMap(newMap: MazeTile[][]) {
    MAZE_MAP = newMap;
    MAZE_HEIGHT = MAZE_MAP.length;
    MAZE_WIDTH = MAZE_MAP[0].length;
    GOAL_POS = { y: MAZE_HEIGHT - 1, x: MAZE_WIDTH - 1 };
}