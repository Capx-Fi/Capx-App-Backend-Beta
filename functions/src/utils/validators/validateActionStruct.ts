/* eslint-disable max-len */
import {ActionTagType} from "../enums/actionTagType";
import {ActionType} from "../enums/actionType";
import {DiscordActionType} from "../enums/discordActionType";
import {NotifyType} from "../enums/notifyType";
import {OnChainVerifyType} from "../enums/onChainVerifyType";
import {TwitterActionType} from "../enums/twitterActionType";

export function validateActionStruct(
    action: any
) {
  try {
    if (
      action.title?.length != 0 &&
          action.type?.length != 0 &&
          action.cta_title?.length != 0 &&
          action.left_title?.length != 0 &&
          Object.values(ActionTagType).includes(action.tag)
    ) {
      if ((Object.values(ActionType).includes(action.type))) {
        if (action.type == ActionType.Quiz) {
          if (
            action.question?.length == 0 &&
                      action.answer?.length == 0 &&
                      action.options?.length == 0
          ) {
            console.log(action.question?.length, action.answer?.length, action.options?.length);
            return false;
          }
        } if (action.type == ActionType.FeedbackForm) {
          if (
            (action.questions?.length == 0 &&
                      action.options?.length == 0) && (action.questions?.length === action.options?.length)
          ) {
            console.log(action.questions?.length, action.answers?.length, action.options?.length);
            return false;
          }
        } else if (action.type == ActionType.SocialTwitter) {
          if ((Object.values(TwitterActionType).includes(action.verification_engine))) {
            if (action.verification_engine == TwitterActionType.UserFollows) {
              if (action.twitter_id_to_follow.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.UserCommented ||
                action.verification_engine == TwitterActionType.UserLikedTweet ||
                action.verification_engine == TwitterActionType.UserQuoted ||
                action.verification_engine == TwitterActionType.UserRetweeted
            ) {
              if (action.tweet_url.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.UserTweet
            ) {
              if (action.tweet_strings.length == 0) {
                return false;
              }
            } else if (
              action.verification_engine == TwitterActionType.TwitterInfo
            ) {
              if (Object.values(action.info_details).length == 0) {
                return false;
              }
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.SocialDiscord) {
          if ((Object.values(DiscordActionType).includes(action.verification_engine))) {
            if (action.guild_id.length == 0) {
              return false;
            }
            if (action.verification_engine == DiscordActionType.UserHasReacted) {
              if (action.channel_id.length == 0 && action.message_id.length == 0 && action.emoji.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserHasRole) {
              if (action.role.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserHasMessaged) {
              if (action.channel_id.length == 0 && action.message.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserInVoiceChannel) {
              if (action.channel_id.length == 0) {
                return false;
              }
            } else if (action.verification_engine == DiscordActionType.UserSubscribedEvent) {
              if (action.event_id.length == 0) {
                return false;
              }
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.Video) {
          if (
            action.media_link?.length == 0
          ) {
            console.log(action.media_link?.length);
            return false;
          }
        } else if (action.type == ActionType.Blog) {
          if (
            action.media_link?.length == 0
          ) {
            console.log(action.media_link?.length);
            return false;
          }
        } else if (action.type == ActionType.Info) {
          if (
            action.details?.length == 0
          ) {
            console.log(action.details?.length);
            return false;
          }
        } else if (action.type == ActionType.Notify) {
          if (action.notification_type) {
            if ((Object.values(NotifyType).includes(action.notification_type))) {
              if (action.notification_type.length == 0) {
                return false;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.GenerateInviteCode) {
          if (action.verification_engine) {
            if (action.verification_engine != "generateInviteCode") {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.GenerateOGInviteCode) {
          if (action.verification_engine) {
            if (action.verification_engine != "generateOGInviteCode") {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.ShareInviteCode) {
          if (action.sharing_platforms) {
            if (action.sharing_platforms.length == 0) {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.CheckProfile) {
          if (action.verification_engine && action.to_check) {
            if (action.verification_engine != "checkUserProfile" && action.to_check.length == 0) {
              return false;
            }
          } else {
            return false;
          }
        } else if (action.type == ActionType.VerifyOnChain) {
          if ((Object.values(OnChainVerifyType).includes(action.verification_engine))) {
            if (action.verification_engine === OnChainVerifyType.VoteHarbor) {
              if (action?.min_voted_proposal.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.MintCMSTVault || action.verification_engine === OnChainVerifyType.MintCMSTStablemint) {
              if (action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.LiquidityFarmMaster) {
              if (action?.poolId.toString().trim().length === 0 || action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.LiquidityFarmChild) {
              if (action?.poolIds.length === 0 || action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.LendCMST) {
              if (action?.asset_id.toString().trim().length === 0 || action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.BorrowWithCMST) {
              if (action?.asset_denom.toString().trim().length === 0 || action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.StakeHarbor) {
              if (action?.harbor_contract.toString().trim().length === 0 || action?.minBlockHeight.toString().trim().length === 0) {
                return false;
              }
            } else if (action.verification_engine === OnChainVerifyType.TradeCSwap) {
              if (action?.minBlockHeight.toString().trim().length === 0 || action?.checkLimitOrder.toString().trim().length === 0 || action?.checkMarketOrder.toString().trim().length === 0 ) {
                return false;
              }
            }
          }
        }
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}
