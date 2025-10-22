// Client Component
'use client';

import React, { useState } from 'react';

/**
 * コメント検索コンポーネント。ユーザー入力を受け付け、Gemini APIを呼び出します。
 * @param {Array} comments - YouTube APIから取得したコメントの配列
 * @param {function} onSearchResult - 検索結果のJSON文字列を受け取るコールバック関数
 */
export const CommentSearch = ({ comments, onSearchResult }) => {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gemini APIのURL定義
  // NOTE: Canvas環境ではAPIキーは実行時に自動で補完されるため、空文字列を使用します。
  const apiKey = "AIzaSyDBD2qFPAKVQh5dLecSnlXlu87iSVR9XJo"; 
  const GEMINI_API_MODEL = "gemini-2.5-flash-preview-09-2025";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:generateContent?key=${apiKey}`;

  // コメント配列とキーワードを元に、Geminiへ渡すプロンプトを作成する関数
  const createPrompt = (keyword, comments) => {
    // 最初の500件のコメントのみを抽出してJSON化し、プロンプトのサイズを制限します
    const commentsToAnalyze = comments.slice(0, 500); 
    const commentsString = JSON.stringify(commentsToAnalyze, null, 2);

    return `
      以下の【コメント配列】の中から、textプロパティの値に"${keyword}"が含まれるオブジェクトのみを抽出してください。
      
      【制約事項】
      1. 結果は抽出されたオブジェクトの配列を含むJSON文字列として、他の説明文やマークダウンを付けずに**そのまま出力**してください。
      2. 抽出対象は、必ずtextプロパティにキーワードが含まれているものに限定してください。

      【コメント配列】
      ${commentsString}
    `;
  };

  const handleSearch = async () => {
    if (!keyword.trim() || !comments || comments.length === 0) {
      alert('キーワードを入力するか、先にYouTubeコメントを取得してください。');
      return;
    }

    setIsLoading(true);
    setError(null);

    const prompt = createPrompt(keyword, comments);
    console.log('Geminiに渡すプロンプト（一部抜粋）:', prompt.substring(0, 500) + '...');
    
    // Gemini APIへの直接呼び出し
    try {
      const payload = {
          contents: [{ parts: [{ text: prompt }] }],
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Geminiのレスポンスからテキスト部分を抽出
      const filteredCommentsJson = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (filteredCommentsJson) {
          // 抽出したJSON文字列を親コンポーネントに渡す
          onSearchResult(filteredCommentsJson); 
      } else {
          throw new Error("Gemini APIからのレスポンス形式が不正です。");
      }

    } catch (e) {
      console.error('Gemini API呼び出しエラー:', e);
      setError(`検索中にエラーが発生しました: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
        AIキーワード検索
      </h2>
      <div className="flex space-x-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="コメント内を検索するキーワードを入力..."
          className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-50"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !comments || comments.length === 0}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            isLoading || !comments || comments.length === 0
              ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
          }`}
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};
