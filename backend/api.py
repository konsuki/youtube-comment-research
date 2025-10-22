from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# サービスロジックをインポート
import youtube_service

# --- FastAPI App Setup ---
app = FastAPI()

# CORS Setup: Next.js (http://localhost:3000)からのアクセスを許可
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 許可するオリジンのリスト
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application Constants (Endpoint specific) ---
VIDEO_ID = "nCtoOJeXmdY"
GOAL_MAX_RESULTS = 1000

# --- Main API Endpoint ---


@app.get("/api/comments")
async def get_video_comments_api(
    video_id: str = VIDEO_ID, goal_max_results: int = GOAL_MAX_RESULTS
) -> Dict[str, Any]:
    """
    YouTube動画のコメントを、nextPageTokenを利用して目標件数まで取得し、JSONで返します。
    ロジックは youtube_service.fetch_comments_with_pagination に委譲します。
    """
    # ロジック部分の関数を呼び出す
    return youtube_service.fetch_comments_with_pagination(video_id, goal_max_results)


@app.get("/api/hello")
async def read_hello_compatibility() -> Dict[str, Any]:
    """/api/hello は /api/comments の結果を返します。"""
    # ロジック部分の関数を呼び出す
    return youtube_service.fetch_comments_with_pagination(VIDEO_ID, GOAL_MAX_RESULTS)
