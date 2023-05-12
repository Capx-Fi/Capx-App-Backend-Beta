/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";

export async function checkIfUserCommented(
    userId: string,
    tweetURL: string
) {
  try {
    // CHECKING IF USER COMMENTED ON TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    // TWITTER ALLOWS ACCESS ONLY TO LAST 7 DAYS OF DATA , SO THIS WILL NOT WORK FOR OLDER TWEETS
    const secrets: any = await exportSecret();
    let paginationToken = "-1";
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
        headers: {
          Authorization: "Bearer " + BEARER_TOKEN,
        },
        params: {
          "query": "in_reply_to_tweet_id:"+tweetId,
          "max_results": 100,
          "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
          "tweet.fields": "author_id,referenced_tweets",
        },
      });
      for (let i = 0; i < response.data.meta.result_count; i++) {
        if (response.data.data[i].author_id == userId) {
          console.log("User commented on tweet");
          return true;
        }
      }
      paginationToken = response.data.meta?.next_token;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
