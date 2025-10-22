import requests
import datetime
from typing import List, Dict, Any, Optional

# --- YouTube API Constants ---
URL = "https://www.googleapis.com/youtube/v3/"
# !!! IMPORTANT: ご自身の有効なAPIキーに置き換えてください !!!
API_KEY = "AIzaSyBTNFt3Jii_eoHDqQluVR6vA60iozUayHc"
# YouTube APIの最大取得件数（maxResultsの制限値）
API_MAX_RESULTS = 100


def format_comment_data(
    snippet_data: Dict[str, Any], is_reply: bool = False
) -> Dict[str, Any]:
    """コメントまたは返信のデータを整形して辞書として返します。"""

    if is_reply:
        target_snippet = snippet_data
        reply_count = 0
    else:
        # commentThreadsのitemまたはrepliesの中のコメントかを判断
        if "topLevelComment" in snippet_data:
            target_snippet = snippet_data["topLevelComment"]["snippet"]
        else:
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


def fetch_comments_with_pagination(
    video_id: str, goal_max_results: int
) -> Dict[str, Any]:
    """
    YouTube動画のトップレベルコメントを、nextPageTokenが返ってこなくなるまで（または目標件数に達するまで）
    取得し、整形された辞書を返します。
    """

    all_comments_data: List[Dict[str, Any]] = []
    next_page_token: Optional[str] = None
    total_api_results: Optional[int] = None

    print(
        f"Service: Fetching comments for video ID: {video_id} with goal max results: {goal_max_results}"
    )

    base_params = {
        "key": API_KEY,
        "part": "replies, snippet",
        "videoId": video_id,
        "order": "time",
        "textFormat": "plaintext",
        "maxResults": API_MAX_RESULTS,
    }

    try:
        while True:
            if len(all_comments_data) >= goal_max_results:
                print(f"Service: Goal of {goal_max_results} comments reached.")
                break

            current_params = base_params.copy()
            if next_page_token:
                current_params["pageToken"] = next_page_token

            # --- APIリクエストの実行 ---
            response = requests.get(URL + "commentThreads", params=current_params)
            response.raise_for_status()
            resource = response.json()

            # 最初の1回目のリクエストでのみ、動画の総コメント数を取得・保存
            if total_api_results is None:
                total_api_results = resource.get("pageInfo", {}).get("totalResults")

            # コメントの処理
            current_page_comments = []
            for comment_thread in resource.get("items", []):
                # 1. トップレベルコメントの整形
                comment = format_comment_data(comment_thread["snippet"])

                # 2. 返信の処理 (snippetに含まれる最初の数件のみ)
                replies = []
                if (
                    "replies" in comment_thread
                    and "comments" in comment_thread["replies"]
                ):
                    for reply_info in comment_thread["replies"]["comments"]:
                        replies.append(format_comment_data(reply_info, is_reply=True))

                comment["replies"] = replies
                current_page_comments.append(comment)

            all_comments_data.extend(current_page_comments)

            # 次のページトークンを取得
            next_page_token = resource.get("nextPageToken")

            # トークンがない場合、つまり全件取得し終えたらループを抜ける
            if not next_page_token:
                print("Service: No more pages left. All available comments fetched.")
                break

        # 成功レスポンスを構築して返す
        return {
            "status": "success",
            "video_id": video_id,
            "total_comments_on_video": total_api_results,
            "total_comments_fetched": len(all_comments_data),
            "comments": all_comments_data[:goal_max_results],
        }

    except requests.exceptions.HTTPError as e:
        # HTTPエラー処理
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
        # ネットワークエラー処理
        return {
            "status": "error",
            "message": "ネットワーク接続またはYouTube APIへのアクセスに失敗しました。",
            "detail": str(e),
        }
    except Exception as e:
        # その他予期せぬエラー処理
        return {
            "status": "error",
            "message": "サーバー側で予期せぬエラーが発生しました。",
            "detail": str(e),
        }
