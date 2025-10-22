// Client Componentで動作
import React from 'react';

/**
 * 取得したコメントデータを整形して表示するコンポーネント。
 */
export const CommentDisplay = ({ apiData, searchResultJson }) => {
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

  const totalComments = apiData.total_comments_on_video;
  const fetchedCount = apiData.total_comments_fetched;
  
  let parsedSearchResult = null;
  if (searchResultJson) {
      try {
          // Geminiからのレスポンス文字列をJSONとしてパース
          parsedSearchResult = JSON.parse(searchResultJson);
      } catch (e) {
          console.error("検索結果のJSONパースに失敗:", e);
          parsedSearchResult = [{ error: "JSONパースエラー", detail: searchResultJson }];
      }
  }


  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-shadow duration-300">
      <p className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
        ✅ YouTubeデータ受信成功！
      </p>
      
      {/* 1. YouTube APIの統計情報 */}
      <div className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-700/50 rounded-md">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            動画全体のコメント総数（API報告値）: 
            <span className="text-2xl font-extrabold ml-2 text-gray-900 dark:text-gray-50">
                {totalComments !== undefined ? totalComments.toLocaleString() : '不明'}
            </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            今回取得したコメント件数（検索対象のデータ）: 
            <span className="font-bold ml-1">{fetchedCount !== undefined ? fetchedCount.toLocaleString() : '不明'}</span>
        </p>
      </div>
      
      {/* 2. Geminiによる検索結果の表示エリア (CommentDisplayの下に配置) */}
      <h2 className="text-xl font-bold mt-8 mb-3 text-gray-800 dark:text-gray-100 border-t pt-4">
          AI検索結果
      </h2>
      {parsedSearchResult ? (
          <div>
              <p className="text-base font-medium mb-2 text-gray-600 dark:text-gray-400">
                抽出されたコメント ({parsedSearchResult.length} 件):
              </p>
              <pre className="bg-yellow-50 dark:bg-gray-900 p-4 rounded-lg text-xs md:text-sm text-gray-800 dark:text-gray-200 shadow-inner overflow-x-auto whitespace-pre-wrap font-mono border border-yellow-300">
                  {parsedSearchResult.length > 0 
                      ? formatJsonForDisplay(parsedSearchResult)
                      : 'キーワードに一致するコメントは見つかりませんでした。'
                  }
              </pre>
          </div>
      ) : (
          <p className="text-gray-500 dark:text-gray-400">
              検索を実行すると、ここに結果が表示されます。
          </p>
      )}

      {/* 3. YouTube APIから取得したコメントの表示エリア (元の表示) */}
      <h3 className="text-base font-medium mt-8 mb-2 text-gray-600 dark:text-gray-400 border-t pt-4">
        全取得コメント ({apiData.comments?.length} 件):
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