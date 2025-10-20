// Client Componentで動作
import React from 'react';

/**
 * 取得したコメントデータを整形して表示するコンポーネント。
 * @param {object} apiData - FastAPIから返されたJSONデータ
 */
export const CommentDisplay = ({ apiData }) => {
  // JSONデータをブラウザ表示用に整形するヘルパー関数
  const formatJsonForDisplay = (data) => JSON.stringify(data, null, 2);

  if (!apiData) return null;

  if (apiData.status === "error") {
    return (
        <div className="text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg shadow-md">
            <p className="font-bold mb-2">API処理エラー</p>
            <p className="text-sm">メッセージ: {apiData.message || '不明なエラー'}</p>
            <p className="text-xs mt-2">詳細: {apiData.detail || '詳細はコンソールを確認してください。'}</p>
        </div>
    );
  }

  if (apiData.status !== "success") return null;

  // 修正点: total_results から total_comments_on_video にキー名を変更
  const totalComments = apiData.total_comments_on_video;
  const fetchedCount = apiData.total_comments_fetched;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-shadow duration-300">
      <p className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
        ✅ データ受信成功！
      </p>
      
      <div className="mb-4 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-700/50 rounded-md">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            動画全体のコメント総数（APIが把握している数）: 
            <span className="text-2xl font-extrabold ml-2 text-gray-900 dark:text-gray-50">
                {totalComments !== undefined ? totalComments.toLocaleString() : '不明'}
            </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            今回取得したコメント件数（目標件数または全件）: 
            <span className="font-bold ml-1">{fetchedCount !== undefined ? fetchedCount.toLocaleString() : '不明'}</span>
        </p>
      </div>
      
      <h3 className="text-base font-medium mb-2 text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        取得コメントの詳細 ({apiData.comments?.length} 件):
      </h3>
      
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs md:text-sm text-gray-800 dark:text-gray-200 shadow-inner overflow-x-auto whitespace-pre-wrap font-mono">
        {apiData.comments && apiData.comments.length > 0 
          ? formatJsonForDisplay(apiData.comments)
          : 'コメント配列は空です。'
        }
      </pre>
    </div>
  );
};

export default CommentDisplay;  