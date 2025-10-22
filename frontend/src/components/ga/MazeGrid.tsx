import { MAZE_MAP, Coordinate, MazeTile } from '../../constants/maze';

interface MazeGridProps {
  // エージェントの現在位置を受け取る (省略可能)
  agentPosition?: Coordinate;
}

const getTileStyle = (tile: MazeTile, isAgent: boolean) => {
  let baseStyle = 'w-8 h-8 flex items-center justify-center border border-gray-600 transition-colors duration-100';

  if (isAgent) {
    // エージェントがいるマス
    return baseStyle + ' bg-red-500 text-white font-bold rounded-md shadow-lg ring ring-offset-2 ring-red-300';
  }

  switch (tile) {
    case 1:
      // 壁
      return baseStyle + ' bg-gray-900';
    case 'S':
      // スタート
      return baseStyle + ' bg-green-600 text-white font-bold';
    case 'G':
      // ゴール
      return baseStyle + ' bg-yellow-500 text-gray-800 font-bold';
    case 0:
    default:
      // 通路
      return baseStyle + ' bg-gray-200';
  }
};

export default function MazeGrid({ agentPosition }: MazeGridProps) {
  return (
    <div className="p-4 bg-gray-700 inline-block rounded-lg shadow-xl">
      {MAZE_MAP.map((row, y) => (
        <div key={y} className="flex">
          {row.map((tile, x) => {
            // エージェントがこのマスにいるかチェック
            const isAgent = agentPosition && agentPosition.y === y && agentPosition.x === x;

            return (
              <div
                key={x}
                className={getTileStyle(tile, isAgent)}
                title={`(${y}, ${x})`}
              >
                {/* エージェントがいる場合はマークを表示 */}
                {isAgent ? 'A' : (tile === 'S' || tile === 'G' ? tile : '')}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}