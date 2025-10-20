
import datetime
import json
import requests

URL = 'https://www.googleapis.com/youtube/v3/'
API_KEY = 'AIzaSyBTNFt3Jii_eoHDqQluVR6vA60iozUayHc'
VIDEO_ID = 'T2fCn6p19po'

def get_video_comment(video_id, n):
    try:
        next_page_token
    except NameError:
        params = {
            'key': API_KEY,
            'part': 'replies, snippet',
            'videoId': VIDEO_ID,
            'order': 'time',
            'textFormat': 'plaintext',
            'maxResults': n,
        }
    else:
        params = {
            'key': API_KEY,
            'part': 'replies, snippet',
            'videoId': VIDEO_ID,
            'order': 'time',
            'textFormat': 'plaintext',
            'pageToken': next_page_token,
            'maxResults': n,
        }
    response = requests.get(URL + 'commentThreads', params=params)
    resource = response.json()
    return resource

def print_video_comment_replies(match):
    for comment_info in match['items']:
        author = comment_info['snippet']['authorDisplayName']
        pubdate = comment_info['snippet']['publishedAt']
        text = comment_info['snippet']['textDisplay']
        pubdate = datetime.datetime.strptime(pubdate, '%Y-%m-%dT%H:%M:%SZ')
        pubdate = pubdate.strftime("%Y/%m/%d %H:%M:%S")
        print('\t___________________________________________\n')
        print("\n\tReply :\n\t{}\n\n\tby: {} date: {}".format(text, author, pubdate), "\n")

def print_video_comment(match):
    global parentId
    for comment_info in match['items']:
        parentId = comment_info['id']
        author = comment_info['snippet']['topLevelComment']['snippet']['authorDisplayName']
        pubdate = comment_info['snippet']['topLevelComment']['snippet']['publishedAt']
        text = comment_info['snippet']['topLevelComment']['snippet']['textDisplay']
        like_cnt = comment_info['snippet']['topLevelComment']['snippet']['likeCount']
        reply_cnt = comment_info['snippet']['totalReplyCount']
        pubdate = datetime.datetime.strptime(pubdate, '%Y-%m-%dT%H:%M:%SZ')
        pubdate = pubdate.strftime("%Y/%m/%d %H:%M:%S")
        print('---------------------------------------------------\n')
        print('{}\n\n by: {} date: {} good: {} reply: {}\n'.format(text, author, pubdate, like_cnt, reply_cnt))
        if reply_cnt > 0:
            replyMatch = treat_reply(match)
            print_video_comment_replies(replyMatch)
            global reply_next_page_token
            try:
                reply_next_page_token = replyMatch["nextPageToken"]
            except KeyError:
                pass
            else:
                while 'reply_next_page_token' in globals():
                    replyMatch = treat_reply(match)
                    print_video_comment_replies(replyMatch)
                    try:
                        reply_next_page_token = replyMatch["nextPageToken"]
                    except KeyError:
                        reply_next_page_token = None
                        del reply_next_page_token
            reply_next_page_token = None
            del reply_next_page_token

def treat_reply(match):
    for comment_info in match['items']:
        try:
            comment_info['replies']
        except KeyError:
            pass
        else:
            try:
                reply_next_page_token
            except NameError:
                params = {
                 'key': API_KEY,
                 'part': 'id, snippet',
                 'parentId': parentId,
                 'textFormat': 'plaintext',
                 'maxResults': 100,
                 'order': 'time',
                }
            else:
                params = {
                 'key': API_KEY,
                 'part': 'id, snippet',
                 'parentId': parentId,
                 'textFormat': 'plaintext',
                 'maxResults': 100,
                 'order': 'time',
                 'pageToken': reply_next_page_token,
                }
            response = requests.get(URL + 'comments', params=params)
            resource = response.json()
            return resource


# Main

key = None

while 'key' in locals():
    match = get_video_comment(VIDEO_ID, 100)
    print_video_comment(match)
    try:
        next_page_token = match["nextPageToken"]
    except KeyError:
        next_page_token = None
        del next_page_token
        del key

