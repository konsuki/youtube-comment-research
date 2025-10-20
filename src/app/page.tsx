'use client';

import React, { useState, useEffect } from 'react';

// Python APIのベースURL。ローカルでFastAPIなどをポート8000で実行することを想定しています。
// 実際の環境に合わせて変更してください。
const PYTHON_API_URL = 'http://127.0.0.1:8000/api/hello?test=こんにちは';

export default function Home() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDataFromPython() {
      try {
        const response = await fetch(PYTHON_API_URL);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} - Python APIとの接続に失敗しました。`);
        }

        // Python APIから返されたJSONデータを受け取る
        const result = await response.json();
        
        // --- 要件: status, video_id, nextPageToken をコンソールに表示 ---
        if (result.status === "success") {
            console.log("--- Python API Status Information ---");
            console.log(`Video ID: ${result.video_id}`);
            console.log(`Next Page Token: ${result.nextPageToken}`);
            console.log("-------------------------------------");
        }
        
        setApiData(result);
      } catch (e) {
        console.error("Fetch Error:", e);
        setError(e.message || "データ取得中に予期せぬエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    }

    fetchDataFromPython();
  }, []); // ページがロードされたときに一度だけ実行

  // JSONデータをブラウザ表示用に整形する関数
  const formatJsonForDisplay = (data) => JSON.stringify(data, null, 2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-600 dark:text-indigo-400">
        Python API連携デモ
      </h1>
      {/* 以下のdivの幅を w-[80%] に変更し、最大幅を max-w-4xl に設定 */}
      <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[80%] max-w-4xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-gray-700 dark:text-gray-200">
          Pythonバックエンドからのレスポンス
        </h2>

        {/* ロード中の表示 */}
        {loading && (
          <p className="text-lg text-blue-500 animate-pulse">
            <span className="inline-block w-4 h-4 mr-2 border-2 border-t-2 border-blue-500 rounded-full border-t-transparent animate-spin"></span>
            Next.jsサーバー経由でPython APIにリクエスト中です...
          </p>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg">
            <p className="font-bold mb-2">接続エラー</p>
            <p className="text-sm">
              {error}
            </p>
            <p className="mt-2 text-xs">
              Pythonサーバー（<code className="font-mono text-xs">http://127.0.0.1:8000/api/hello</code>）が実行中か確認してください。
            </p>
          </div>
        )}

        {/* データ表示 (apiDataがあり、statusがsuccessの場合のみ表示) */}
        {apiData && apiData.status === "success" && (
          <div>
            <p className="text-lg font-medium mb-3 text-green-600 dark:text-green-400">
              ✅ データ受信成功！ (Next.jsサーバーが仲介)
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
            
            {/* 元のJSON全体表示と表示例のブロックは、今回要求された表示内容に置き換えられました。*/}
          </div>
        )}

        {/* APIステータスが "error" の場合の表示を追加 (API構造に基づき、エラーハンドリングを強化) */}
        {apiData && apiData.status === "error" && (
            <div className="text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg">
                <p className="font-bold mb-2">API処理エラー</p>
                <p className="text-sm">メッセージ: {apiData.message || '不明なエラー'}</p>
                <p className="text-xs mt-2">詳細: {apiData.detail || '詳細はコンソールを確認してください。'}</p>
            </div>
        )}
      </div>
    </div>
  );
}
