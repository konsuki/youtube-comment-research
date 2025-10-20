'use client';
import React from 'react';

/**
 * ローディング状態とエラーメッセージを表示するコンポーネント。
 */
export const LoadingAndErrorDisplay = ({ loading, error }) => {
  if (loading) {
    return (
      <p className="text-lg text-blue-500 animate-pulse">
        <span className="inline-block w-4 h-4 mr-2 border-2 border-t-2 border-blue-500 rounded-full border-t-transparent animate-spin"></span>
        Python APIにリクエスト中です...
      </p>
    );
  }

  if (error) {
    return (
      <div className="text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg">
        <p className="font-bold mb-2">接続エラー</p>
        <p className="text-sm">
          {error}
        </p>
        <p className="mt-2 text-xs">
          Pythonサーバー（<code className="font-mono text-xs">http://127.0.0.1:8000/api/hello</code>）が実行中か確認してください。
        </p>
      </div>
    );
  }

  return null;
};