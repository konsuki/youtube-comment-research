'use client'; // Client Componentで動作

import React, { useState, useEffect } from 'react';

// Python APIのベースURL。ローカルでFastAPIなどをポート8000で実行することを想定しています。
// 実際の環境に合わせて変更してください。
const PYTHON_API_URL = 'http://127.0.0.1:8000/api/hello?test=こんにちは';

/**
 * APIからデータを取得し、状態を管理するカスタムフック。
 * @returns {object} { apiData, loading, error }
 */
export const useApiData = () => {
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

        const result = await response.json();
        
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

  return { apiData, loading, error };
};