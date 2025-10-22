import { useState, useCallback } from 'react';
import { setMazeMap, generateRandomMaze } from '@/constants/maze';
import { useGeneticAlgorithm } from '../../hooks/ga/useGeneticAlgorithm'; // リセットのために使用
import { ChevronDown, ChevronUp } from 'lucide-react'; // アイコンライブラリを使用 (npm install lucide-react)

interface SettingsPanelProps {
  onMazeChange: () => void; // 迷路が変更されたときに親コンポーネントに通知するコールバック
}

export default function SettingsPanel({ onMazeChange }: SettingsPanelProps) {
  const { resetGA } = useGeneticAlgorithm();
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(7);
  const [width, setWidth] = useState(7);
  const [wallRatio, setWallRatio] = useState(0.3);

  const handleGenerateMaze = useCallback(() => {
    try {
      const newMap = generateRandomMaze(height, width, wallRatio);
      setMazeMap(newMap);
      resetGA(); // マップが変わったためGAをリセット
      onMazeChange(); // 親コンポーネントに通知 (再描画のトリガー)
      alert(`新しい ${height}x${width} の迷路を生成しました。GAがリセットされました。`);
    } catch (e) {
      alert("迷路の生成エラー: 3x3以上のサイズを設定してください。");
    }
  }, [height, width, wallRatio, resetGA, onMazeChange]);

  return (
    <div className="w-full bg-white rounded-lg shadow-xl border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 font-bold text-lg bg-gray-100 hover:bg-gray-200 transition rounded-t-lg"
      >
        迷路とGA設定 
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t">
          <h3 className="font-semibold text-gray-700">迷路サイズ設定</h3>

          {/* 迷路の高さ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">高さ (H: 3-30)</label>
            <input
              type="number"
              min="3"
              max="30"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>

          {/* 迷路の幅 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">幅 (W: 3-30)</label>
            <input
              type="number"
              min="3"
              max="30"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>
          
          {/* 壁の密度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">壁の密度 ({wallRatio.toFixed(2)})</label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={wallRatio}
              onChange={(e) => setWallRatio(Number(e.target.value))}
              className="mt-1 block w-full"
            />
            <p className="text-xs text-gray-500">高いほど迷路が複雑になります。</p>
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerateMaze}
            className="w-full py-2 px-4 bg-yellow-500 text-gray-900 font-bold rounded-md hover:bg-yellow-600 transition"
          >
            ランダムな新しい迷路を生成
          </button>
        </div>
      )}
    </div>
  );
}