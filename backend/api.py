from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
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
    allow_origins=origins,  # 許可するオリジンのリスト
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- YouTube API Constants ---
# !!! IMPORTANT: ご自身の有効なAPIキーに置き換えてください !!!
URL = "https://www.googleapis.com/youtube/v3/"
API_KEY = "AIzaSyBTNFt3Jii_eoHDqQluVR6vA60iozUayHc"  # ユーザー提供のキーを暫定的に使用
VIDEO_ID = "DtK8EYZB6sA"

# YouTube APIの最大取得件数（maxResultsの制限値）
API_MAX_RESULTS = 100
# デフォルトの目標取得件数（ユーザーが指定したい150件をデフォルト値として設定）
GOAL_MAX_RESULTS = 1000

# --- Helper Functions ---


def format_comment_data(
    snippet_data: Dict[str, Any], is_reply: bool = False
) -> Dict[str, Any]:
    """コメントまたは返信のデータを整形して辞書として返します。"""

    # トップレベルコメントは 'topLevelComment' の下に、返信はそのものの 'snippet' の下にデータがある
    if is_reply:
        target_snippet = snippet_data
        reply_count = 0
    else:
        # snippet_dataがcommentThreadsのitemの場合、topLevelCommentを参照
        if "topLevelComment" in snippet_data:
            target_snippet = snippet_data["topLevelComment"]["snippet"]
        else:  # repliesの中のコメントの場合、snippetを直接参照
            target_snippet = snippet_data["snippet"]

        reply_count = snippet_data.get("totalReplyCount", 0)

    author = target_snippet.get("authorDisplayName")
    pubdate_str = target_snippet.get("publishedAt")
    text = target_snippet.get("textDisplay")
    like_cnt = target_snippet.get("likeCount", 0)

    try:
        # ISO 8601形式の時刻文字列を整形
        pubdate = datetime.datetime.strptime(pubdate_str, "%Y-%m-%dT%H:%M:%SZ")
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
async def get_video_comments_api(
    video_id: str = VIDEO_ID, goal_max_results: int = GOAL_MAX_RESULTS
):
    """
    YouTube動画のトップレベルコメントを、nextPageTokenが返ってこなくなるまで（または目標件数に達するまで）取得し、JSONで返します。
    """

    # 初期設定
    all_comments_data: List[Dict[str, Any]] = []
    next_page_token: Optional[str] = None
    total_api_results: Optional[int] = None  # 追加: APIが返す総コメント数を格納する変数

    print(
        f"Fetching comments for video ID: {video_id} with goal max results: {goal_max_results}"
    )

    # APIリクエストの共通パラメータ
    base_params = {
        "key": API_KEY,
        "part": "replies, snippet",
        "videoId": video_id,
        "order": "time",
        "textFormat": "plaintext",
        # APIの最大制限である100件を使用
        "maxResults": API_MAX_RESULTS,
    }

    try:
        while True:
            # 取得したコメントが目標件数に達した場合、リクエストを停止
            if len(all_comments_data) >= goal_max_results:
                print(f"Goal of {goal_max_results} comments reached.")
                break

            # APIリクエスト用の現在のパラメータ
            current_params = base_params.copy()
            if next_page_token:
                current_params["pageToken"] = next_page_token

            # --- APIリクエストの実行 ---
            response = requests.get(URL + "commentThreads", params=current_params)
            response.raise_for_status()  # HTTPエラー (4xx, 5xx) の場合に例外を発生
            resource = response.json()

            # 最初の1回目のリクエストでのみ、動画の総コメント数を取得・保存
            if total_api_results is None:
                total_api_results = resource.get("pageInfo", {}).get("totalResults")

            # コメントの処理
            current_page_comments = []
            for comment_thread in resource.get("items", []):
                # 1. トップレベルコメントの整形
                # comment_thread['snippet']は commentThread resource
                comment = format_comment_data(comment_thread["snippet"])

                # 2. 返信の処理 (snippetに含まれる最初の数件のみ)
                replies = []
                if (
                    "replies" in comment_thread
                    and "comments" in comment_thread["replies"]
                ):
                    for reply_info in comment_thread["replies"]["comments"]:
                        # 返信は is_reply=True で整形
                        replies.append(format_comment_data(reply_info, is_reply=True))

                comment["replies"] = replies
                current_page_comments.append(comment)

            all_comments_data.extend(current_page_comments)

            # 次のページトークンを取得
            next_page_token = resource.get("nextPageToken")

            # トークンがない場合、つまり全件取得し終えたらループを抜ける
            if not next_page_token:
                print("No more pages left. All available comments fetched.")
                break

        # 最終的なレスポンスを構築
        return {
            "status": "success",
            "video_id": video_id,
            "total_comments_on_video": total_api_results,  # 修正: 総コメント数を追加
            "total_comments_fetched": len(all_comments_data),  # 実際に取得した総件数
            # 目標件数を超えた場合はスライスして返す
            "comments": all_comments_data[:goal_max_results],
        }

    except requests.exceptions.HTTPError as e:
        # HTTPエラー (400 Bad Request, 403 Forbiddenなど)
        # エラー発生時のレスポンスボディを取得（デバッグ用）
        response_body = (
            response.json() if "response" in locals() and response.text else None
        )
        return {
            "status": "error",
            "message": f"YouTube APIエラーが発生しました。APIキーまたは権限を確認してください。",
            "detail": str(e),
            "response_body": response_body,
        }
    except requests.exceptions.RequestException as e:
        # ネットワークエラーなど
        return {
            "status": "error",
            "message": "ネットワーク接続またはYouTube APIへのアクセスに失敗しました。",
            "detail": str(e),
        }
    except Exception as e:
        # その他の予期せぬエラー
        return {
            "status": "error",
            "message": "サーバー側で予期せぬエラーが発生しました。",
            "detail": str(e),
        }


@app.get("/api/hello")
async def read_hello_compatibility():
    """/api/hello は /api/comments の結果を返します。"""
    return await get_video_comments_api()
