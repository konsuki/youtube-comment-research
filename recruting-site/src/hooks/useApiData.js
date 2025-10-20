'use client'; // Client Componentで動作

import React, { useState, useEffect } from 'react';

// Python APIのベースURL。ローカルでFastAPIなどをポート8000で実行することを想定しています。
// 実際の環境に合わせて変更してください。
const PYTHON_API_URL = 'http://127.0.0.1:8000/api/hello?test=こんにちは';

/**
 * APIからデータを取得し、状態を管理するカスタムフック。
 * @param {string} keyword - フィルタリングに使用するキーワード
 * @returns {object} { apiData, filteredComments, loading, error }
 */
export const useApiData = (keyword) => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredComments, setFilteredComments] = useState(null); // ★ フィルタリング結果用の状態を追加

  useEffect(() => {
    async function fetchDataFromPython() {
      try {
        const response = await fetch(PYTHON_API_URL);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} - Python APIとの接続に失敗しました。`);
        }

        const result = await response.json();
        console.log("API Response:", result);
        
        // --- 要件: status, video_id, nextPageToken をコンソールに表示 ---
        if (result.status === "success") {
            console.log("--- Python API Status Information (useApiData Hook) ---");
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
  }, []);

  // ★ フィルタリングロジックを独立したuseEffectに入れる
  useEffect(() => {
    if (apiData && apiData.comments && keyword) {
        // キーワードが空でない、かつコメント配列がある場合のみフィルタリングを実行
        const lowerCaseKeyword = keyword.toLowerCase();
        
        const filtered = apiData.comments.filter(comment => {
            // textプロパティの文字列の中にkeywordが含まれているかチェック
            if (comment.text) {
                return comment.text.toLowerCase().includes(lowerCaseKeyword);
            }
            return false; // textプロパティがない場合は除外
        });
        
        setFilteredComments(filtered);
    } else if (apiData && !keyword) {
        // キーワードが空の場合は、フィルタリング結果も空にするなど、要件に応じて調整
        // 今回はシンプルにnull/空配列にします
        setFilteredComments([]);
    }

  }, [apiData, keyword]); // apiDataまたはkeywordが変更されたときに再実行

  return { apiData, filteredComments, loading, error }; // ★ フィルタリング結果を返す
};