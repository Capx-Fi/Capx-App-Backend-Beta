/* eslint-disable max-len */
import {TwitterActionType} from "../enums/twitterActionType";
import {checkIfUserFollows} from "../twitter/checkIfUserFollows";
import {checkIfUserLikedTweet} from "../twitter/checkIfUserLikedTweet";
import {checkIfUserRetweeted} from "../twitter/checkIfUserRetweeted";
import {checkIfUserCommented} from "../twitter/checkIfUserCommented";
import {checkIfUserQuoted} from "../twitter/checkIfUserQuoted";
import {checkUserTweet} from "../twitter/checkUserTweet";

export async function verifyTwitterActions(
    action: any,
    userTwitterId: string,
    tweetURL: string,
) {
  try {
    if (action.verification_engine == TwitterActionType.UserFollows) {
      return await checkIfUserFollows(userTwitterId, action.twitter_id_to_follow);
    } else if ( action.verification_engine == TwitterActionType.UserCommented) {
      return await checkIfUserCommented(userTwitterId, action.tweet_url);
    } else if ( action.verification_engine == TwitterActionType.UserLikedTweet) {
      return await checkIfUserLikedTweet(userTwitterId, action.tweet_url);
    } else if ( action.verification_engine == TwitterActionType.UserQuoted) {
      return await checkIfUserQuoted(userTwitterId, action.tweet_url);
    } else if ( action.verification_engine == TwitterActionType.UserRetweeted) {
      return await checkIfUserRetweeted(userTwitterId, action.tweet_url);
    } else if ( action.verification_engine == TwitterActionType.UserTweet) {
      return await checkUserTweet(userTwitterId, tweetURL, action.tweet_strings);
    } else if ( action.verification_engine == TwitterActionType.TwitterInfo) {
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}

