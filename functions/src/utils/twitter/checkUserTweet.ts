/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";

export async function checkUserTweet(
    userId: string,
    tweetURL: string,
    toCheck: [string]
) {
  try {
    // CHECKING IF USER RETWEETED TWEET
    // WILL NOT WORK IF USER'S TWEETS or COMPANY'S TWEETS ARE PRIVATE
    const secrets: any = await exportSecret();
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    const tweetId = tweetURL.split("?")[0].split("/")[5];
    const response = await axios.get("https://api.twitter.com/2/tweets/"+tweetId + "?expansions=author_id", {
      headers: {
        Authorization: "Bearer " + BEARER_TOKEN,
      },
    });
    if (response.data.data.author_id == userId) {
      for (let i = 0; i < toCheck.length; i++) {
        if (!response.data.data.text.includes(toCheck[i])) {
          return false;
        }
      }
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
