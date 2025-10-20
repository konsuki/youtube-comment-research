// Client Componentで動作
import React from 'react';

/**
 * 取得したコメントデータを整形して表示するコンポーネント。
 */
export const CommentDisplay = ({ apiData }) => {
  // JSONデータをブラウザ表示用に整形するヘルパー関数
  const formatJsonForDisplay = (data) => JSON.stringify(data, null, 2);

  if (!apiData) return null;

  if (apiData.status === "error") {
    return (
        <div className="text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg">
            <p className="font-bold mb-2">API処理エラー</p>
            <p className="text-sm">メッセージ: {apiData.message || '不明なエラー'}</p>
            <p className="text-xs mt-2">詳細: {apiData.detail || '詳細はコンソールを確認してください。'}</p>
        </div>
    );
  }

  if (apiData.status !== "success") return null;

  return (
    <div>
      <p className="text-lg font-medium mb-3 text-green-600 dark:text-green-400">
        ✅ データ受信成功！
      </p>
      
      {/* 要件: total_resultsを使ってコメント総数を表示 */}
      <p className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        コメント総数：{apiData.total_results ? apiData.total_results.toLocaleString() : '不明'}
      </p>
      
      <h3 className="text-base font-medium mb-1 text-gray-600 dark:text-gray-400">
        コメント：
      </h3>
      {/* 要件: commentsの中身の配列を整形して表示 */}
      <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 shadow-inner whitespace-pre-wrap">
        {apiData.comments && apiData.comments.length > 0 
          ? formatJsonForDisplay(apiData.comments)
          : 'コメント配列は空です。'
        }
      </pre>
    </div>
  );
};