'use client';

import React from 'react';
import { useApiData } from '../hooks/useApiData'; 
import { LoadingAndErrorDisplay } from '../components/LoadingAndErrorDisplay';
import { CommentDisplay } from '../components/CommentDisplay';

export default function Home() {
  const { apiData, loading, error } = useApiData();
  const showComments = apiData && apiData.status === "success" && !loading && !error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-600 dark:text-indigo-400">Python API連携デモ</h1>      
      <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[80%] max-w-4xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-gray-700 dark:text-gray-200">
          YouTubeコメントデータ
        </h2>
        <LoadingAndErrorDisplay 
          loading={loading} 
          error={error} 
        />
        {showComments && <CommentDisplay apiData={apiData} />}        
        {!loading && !error && apiData && apiData.status === "error" && (
            <CommentDisplay apiData={apiData} />
        )}
      </div>
    </div>
  );
}