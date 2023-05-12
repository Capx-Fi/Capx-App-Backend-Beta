/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";

export async function checkIfUserRetweeted(
    userId: string,
    tweetURL: string
) {
  try {
    console.log(`UserId -> ${userId}, TweetURL -> ${tweetURL}`);
    // CHECKING IF USER RETWEETED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    const secrets: any = await exportSecret();
    let paginationToken = "-1";
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId+"/retweeted_by", {
        headers: {
          Authorization: "Bearer " + BEARER_TOKEN,
        },
        params: {
          "max_results": 100,
          "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
        },
      });
      for (let i = 0; i < response.data.meta.result_count; i++) {
        if (response.data.data[i].id == userId) {
          console.log("User retweeted tweet");
          return true;
        }
      }
      paginationToken = response.data.meta?.next_token;
    }
  } catch (error) {
    console.log(error);
  }
  return false;
}
