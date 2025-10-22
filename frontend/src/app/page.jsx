// Client Component
'use client';

import { useState, useEffect } from 'react';
import { CommentDisplay } from '../components/CommentDisplay';
import { CommentSearch } from '../components/CommentSearch'; // 新しくインポート

// FastAPIのURLを定義
const YOUTUBE_API_URL = 'http://localhost:8000/api/comments';

export default function Home() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState(null); // Gemini検索結果を格納

  // YouTubeコメントを取得する関数
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      // YouTubeコメント取得APIを呼び出す
      const response = await fetch(YOUTUBE_API_URL);
      const data = await response.json();

      if (data.status === 'error') {
        setError(data.message || 'コメント取得中にエラーが発生しました。');
      } else {
        setApiData(data);
      }
    } catch (e) {
      console.error('API呼び出しエラー:', e);
      setError('ネットワークエラーまたはAPI接続に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">
        YouTubeコメント分析ツール (Gemini連携)
      </h1>

      {/* 1. データのロード/エラー表示 */}
      {loading && <p className="text-blue-500">コメントを取得中...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {/* 2. 検索コンポーネント (YouTubeコメント取得後のみ表示) */}
      {apiData && apiData.status === 'success' && apiData.comments && (
        <CommentSearch
          comments={apiData.comments}
          onSearchResult={setSearchResult} // 検索結果をstateにセット
        />
      )}

      {/* 3. コメント表示コンポーネント */}
      <CommentDisplay 
        apiData={apiData} 
        searchResultJson={searchResult} // 検索結果を渡す
      />
    </div>
  );
}