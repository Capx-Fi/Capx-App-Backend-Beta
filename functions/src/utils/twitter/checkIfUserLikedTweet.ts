/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";
// const secrets = require("./secrets.json")

export async function checkIfUserLikedTweet(
    userId: string,
    tweetURL: string
) {
  try {
    // CHECKING IF USER LIKED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    const secrets: any = await exportSecret();
    let paginationToken = "-1";
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId+"/liking_users", {
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
          console.log("User liked tweet");
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
