from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import requests
import datetime

# --- FastAPI App Setup ---
app = FastAPI()

# CORS Setup: Next.js (http://localhost:3000)からのアクセスを許可
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # 許可するオリジンのリスト
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- YouTube API Constants ---
# !!! IMPORTANT: ご自身の有効なAPIキーに置き換えてください !!!
URL = 'https://www.googleapis.com/youtube/v3/'
API_KEY = 'AIzaSyBTNFt3Jii_eoHDqQluVR6vA60iozUayHc' # ユーザー提供のキーを暫定的に使用
VIDEO_ID = 'DtK8EYZB6sA'
MAX_RESULTS_PER_PAGE = 150

# --- Helper Functions ---

def format_comment_data(snippet_data: Dict[str, Any], is_reply: bool = False) -> Dict[str, Any]:
    """コメントまたは返信のデータを整形して辞書として返します。"""
    
    # トップレベルコメントは 'topLevelComment' の下に、返信はそのものの 'snippet' の下にデータがある
    if is_reply:
        target_snippet = snippet_data
        reply_count = 0
    else:
        target_snippet = snippet_data['topLevelComment']['snippet']
        reply_count = snippet_data.get('totalReplyCount', 0)

    author = target_snippet.get('authorDisplayName')
    pubdate_str = target_snippet.get('publishedAt')
    text = target_snippet.get('textDisplay')
    like_cnt = target_snippet.get('likeCount', 0)
    
    try:
        # ISO 8601形式の時刻文字列を整形
        pubdate = datetime.datetime.strptime(pubdate_str, '%Y-%m-%dT%H:%M:%SZ')
        pubdate_formatted = pubdate.strftime("%Y/%m/%d %H:%M:%S")
    except (ValueError, TypeError, AttributeError):
        pubdate_formatted = pubdate_str

    return {
        "author": author,
        "date": pubdate_formatted,
        "text": text,
        "likes": like_cnt,
        "totalReplies": reply_count,
    }


# --- Main API Endpoint ---

@app.get("/api/comments")
async def get_video_comments_api(video_id: str = VIDEO_ID, max_results: int = MAX_RESULTS_PER_PAGE):
    """
    YouTube動画のトップレベルコメントとその返信（最初のページに含まれるもの）を取得し、JSONで返します。
    """
    print(f"Fetching comments for video ID: {video_id} with max results: {max_results}")
    # YouTube API 'commentThreads' エンドポイントのパラメータ
    params = {
        'key': API_KEY,
        'part': 'replies, snippet',
        'videoId': video_id,
        'order': 'time',
        'textFormat': 'plaintext',
        'maxResults': max_results,
    }

    try:
        # APIリクエストを実行
        response = requests.get(URL + 'commentThreads', params=params)
        response.raise_for_status() # HTTPエラー (4xx, 5xx) の場合に例外を発生
        resource = response.json()
        print(resource)
        
        comments_data = []
        for comment_thread in resource.get('items', []):
            # 1. トップレベルコメントの整形
            comment = format_comment_data(comment_thread['snippet'])
            
            # 2. 返信の処理 (snippetに含まれる最初の数件のみ)
            replies = []
            # 'replies'キーが存在し、かつ中に 'comments'リストがあるか確認
            if 'replies' in comment_thread and 'comments' in comment_thread['replies']:
                for reply_info in comment_thread['replies']['comments']:
                    # 返信は is_reply=True で整形
                    replies.append(format_comment_data(reply_info['snippet'], is_reply=True))
            
            comment["replies"] = replies

            comments_data.append(comment)

        # 最終的なレスポンスを構築
        return {
            "status": "success",
            "video_id": video_id,
            "nextPageToken": resource.get("nextPageToken"),
            "total_results": resource.get("pageInfo", {}).get("totalResults"),
            "comments": comments_data
        }

    except requests.exceptions.HTTPError as e:
        # 400 Bad Request (APIキー無効など) や 403 Forbidden などのエラー
        return {
            "status": "error",
            "message": f"YouTube APIエラーが発生しました。APIキーまたは権限を確認してください。",
            "detail": str(e),
            "response_body": response.json() if 'response' in locals() else None
        }
    except requests.exceptions.RequestException as e:
        # ネットワークエラーなど
        return {
            "status": "error",
            "message": "ネットワーク接続またはYouTube APIへのアクセスに失敗しました。",
            "detail": str(e)
        }
    except Exception as e:
        # その他の予期せぬエラー
        return {
            "status": "error",
            "message": "サーバー側で予期せぬエラーが発生しました。",
            "detail": str(e)
        }

@app.get("/api/hello")
async def read_hello_compatibility():
    """/api/hello は /api/comments の結果を返します。"""
    return await get_video_comments_api()