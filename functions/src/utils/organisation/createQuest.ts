/* eslint-disable max-len */
import * as crypto from "crypto";
import {ActionType} from "../enums/actionType";
import {DiscordActionType} from "../enums/discordActionType";
import {TwitterActionType} from "../enums/twitterActionType";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../init/init";
import {OnChainVerifyType} from "../enums/onChainVerifyType";

export async function createQuest(
    token : any,
    data: any,
) {
  if (!token?.email) {
    return {success: false, message: "ERROR: Invalid Token"};
  }
  if (token?.email.toString() != "shreyas@capx.global") {
    return {success: false, message: "ERROR: Insufficient Permissions"};
  }
  try {
    // Check if Organisation Exists
    const _checkEmail = await db.collection("xorgs").where("email", "==", token?.email?.toString()).get();
    if (_checkEmail.size == 0) {
      return {success: false, message: "ERROR: NO Organisation exists."};
    }
    const _orgId = crypto.createHash("sha256").update(token?.email).digest("base64");

    const _org = await db.collection("xorgs").doc(_orgId).get();
    if (_org.exists) {
      const org = _org.data();
      const _questId: string = _orgId + "_" +(Number(org?.listed_quests) + 1).toString();

      // Create actionIndividual
      const _actionIndObjects: any = [];
      const _actionsAggObject: any = [];
      const _actionPublicObjects: any = [];

      for (let i=0; i < data.actions.length; i++) {
        const _action = data.actions[i];
        if (_action.type == ActionType.Quiz) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Quiz,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                question: _action.question,
                answer: _action.answer,
                options: _action.options,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Quiz,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Quiz,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                question: _action.question,
                options: _action.options,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.FeedbackForm) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.FeedbackForm,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                questions: _action.questions,
                options: _action.options,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.FeedbackForm,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.FeedbackForm,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                questions: _action.questions,
                options: _action.options,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.AlphaAirDrop) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.AlphaAirDrop,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.AlphaAirDrop,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.AlphaAirDrop,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.HarborAirdrop) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.HarborAirdrop,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.HarborAirdrop,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.HarborAirdrop,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.ConnectCapxWallet) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.ConnectCapxWallet,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.ConnectCapxWallet,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.ConnectCapxWallet,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.SocialDiscord) {
          if (_action.verification_engine == DiscordActionType.UserHasReacted) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  message_id: _action.message_id,
                  emoji: _action.emoji,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  message_id: _action.message_id,
                  emoji: _action.emoji,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == DiscordActionType.UserHasRole) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  role: _action.role,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  role: _action.role,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == DiscordActionType.UserHasMessaged) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  message: _action.message,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  message: _action.message,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == DiscordActionType.UserInVoiceChannel) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  channel_id: _action.channel_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == DiscordActionType.UserSubscribedEvent) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  event_id: _action.event_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  event_id: _action.event_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  guild_id: _action.guild_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialDiscord,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialDiscord,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  guild_id: _action.guild_id,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          }
        } else if (_action.type == ActionType.SocialTwitter || _action.type === ActionType.SocialTwitterVerify) {
          if (_action.verification_engine == TwitterActionType.UserFollows) {
            const twitterUsername: string = await (await import("../twitter/getUsernameFromId")).getUsernameFromId(`${_action.twitter_id_to_follow}`);
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  twitter_id_to_follow: _action.twitter_id_to_follow.toString(),
                  twitter_id_username: twitterUsername,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialTwitterVerify,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  twitter_id_to_follow: _action.twitter_id_to_follow,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == TwitterActionType.UserTweet) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  tweet_strings: _action?.tweet_strings,
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialTwitterVerify,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  tweet_strings: _action?.tweet_strings,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == TwitterActionType.TwitterInfo) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialTwitter,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  info_details: _action?.info_details,
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialTwitter,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialTwitter,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  info_details: _action?.info_details,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  tweet_url: _action.tweet_url,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialTwitterVerify,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  tweet_url: _action.tweet_url,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          }
        } else if (_action.type == ActionType.Video) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Video,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                media_link: _action.media_link,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Video,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Video,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                media_link: _action.media_link,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.Blog) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Blog,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                media_link: _action.media_link,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Blog,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Blog,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                media_link: _action.media_link,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.Notify) {
          if (data.start_date) {
            try {
              if (new Date(data.start_date).getTime() <= new Date().getTime()) {
                return {success: false, message: "ERROR: Invalid `start_date` parameter value!"};
              }
            } catch (err) {
              console.error(err);
              return {success: false, message: "ERROR: Invalid `start_date` parameter value!"};
            }
          } else {
            return {success: false, message: "ERROR: Missing parameter `start_date`"};
          }
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Notify,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                notification_type: _action.notification_type,
                notifying_email: "",
                start_date: Math.ceil(new Date(data.start_date).getTime() / 1000),
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Notify,
                start_date: Math.ceil(new Date(data.start_date).getTime() / 1000),
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Notify,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                start_date: Math.ceil(new Date(data.start_date).getTime() / 1000),
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.GenerateInviteCode) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.GenerateInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                verification_engine: _action.verification_engine,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.GenerateInviteCode,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.GenerateInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.GenerateOGInviteCode) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.GenerateOGInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                verification_engine: _action.verification_engine,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.GenerateOGInviteCode,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.GenerateOGInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.ShareInviteCode) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.ShareInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                sharing_platforms: _action.sharing_platforms,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.ShareInviteCode,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.ShareInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                sharing_platforms: _action.sharing_platforms,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.VerifyInviteCode) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.VerifyInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                verification_engine: _action.verification_engine,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.VerifyInviteCode,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.VerifyInviteCode,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.CheckProfile) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.CheckProfile,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                verification_engine: _action.verification_engine,
                to_check: _action.to_check,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.CheckProfile,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.CheckProfile,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                to_check: _action.to_check,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.DailyReward) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.DailyReward,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.DailyReward,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.DailyReward,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.Info) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Info,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                details: _action.details,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Info,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Info,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                details: _action.details,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.SubmitForReview) {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.SubmitForReview,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.SubmitForReview,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.SubmitForReview,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (
          _action.type == ActionType.FullName ||
          _action.type == ActionType.ProfileImage ||
          _action.type == ActionType.LinkDiscord ||
          _action.type == ActionType.LinkTwitter
        ) {
          if (data.start_date) {
            try {
              if (new Date(data.start_date).getTime() < new Date().getTime()) {
                return {success: false, message: "ERROR: Invalid `start_date` parameter value!"};
              }
            } catch (err) {
              console.error(err);
              return {success: false, message: "ERROR: Invalid `start_date` parameter value!"};
            }
          } else {
            return {success: false, message: "ERROR: Missing parameter `start_date`"};
          }
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: _action.type,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: _action.type,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: _action.type,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        } else if (_action.type == ActionType.VerifyOnChain) {
          if (_action.verification_engine == OnChainVerifyType.VoteHarbor) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: OnChainVerifyType.VoteHarbor,
                  min_voted_proposals: _action.min_voted_proposal,
                  action_info: _action.info,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.MintCMSTStablemint) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  verification_engine: OnChainVerifyType.MintCMSTStablemint,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.MintCMSTVault) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  verification_engine: OnChainVerifyType.MintCMSTVault,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.LiquidityFarmMaster) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  poolId: _action.poolId,
                  verification_engine: OnChainVerifyType.LiquidityFarmMaster,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.LiquidityFarmChild) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  poolIds: _action.poolIds,
                  verification_engine: OnChainVerifyType.LiquidityFarmChild,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.LendCMST) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  asset_id: _action.asset_id,
                  verification_engine: OnChainVerifyType.LendCMST,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.BorrowWithCMST) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  asset_denom: _action.asset_denom,
                  verification_engine: OnChainVerifyType.BorrowWithCMST,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.StakeHarbor) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  harbor_contract: _action.harbor_contract,
                  verification_engine: OnChainVerifyType.BorrowWithCMST,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else if (_action.verification_engine == OnChainVerifyType.TradeCSwap) {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  action_info: _action.info,
                  minBlockHeight: _action.minBlockHeight,
                  checkLimitOrder: _action.checkLimitOrder?.toLowerCase?.() === "true",
                  checkMarketOrder: _action.checkMarketOrder.toLowerCase?.() === "true",
                  verification_engine: OnChainVerifyType.TradeCSwap,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.VerifyOnChain,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          } else {
            _actionIndObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  user_count: Number(0),
                  type: ActionType.VerifyOnChain,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                  user_ids: [],
                }
            );
            _actionsAggObject.push(
                {
                  action_id: i+1,
                  title: _action.title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  type: ActionType.SocialTwitterVerify,
                }
            );
            _actionPublicObjects.push(
                {
                  docType: "Individual",
                  title: _action.title,
                  type: ActionType.SocialTwitterVerify,
                  cta_title: _action.cta_title,
                  left_title: _action.left_title,
                  action_tag: _action.tag,
                  verification_engine: _action.verification_engine,
                  reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                }
            );
          }
        } else {
          _actionIndObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                user_count: Number(0),
                type: ActionType.Claim,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
                user_ids: [],
              }
          );
          _actionsAggObject.push(
              {
                action_id: i+1,
                title: _action.title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                type: ActionType.Claim,
              }
          );
          _actionPublicObjects.push(
              {
                docType: "Individual",
                title: _action.title,
                type: ActionType.Claim,
                cta_title: _action.cta_title,
                left_title: _action.left_title,
                action_tag: _action.tag,
                reward_amount: _action?.action_reward_amount ? Number(_action?.action_reward_amount) : Number(0),
              }
          );
        }
      }
      const createdOn = Math.ceil(new Date().getTime() / 1000);
      // Create Task as an individual Object.
      const questIndObj = {
        doc_type: "Individual",
        quest_type: data.type.trim(),
        title: data.title,
        tags: data.tags,
        cta_title: data.cta_title,
        description: data.description,
        rewards_type: data.rewards_type,
        max_rewards: Number(data.reward),
        image_url: data.image_url.trim(),
        expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
        user_count: Number(0),
        user_ids: [],
        actions: _actionsAggObject,
        org_id: _orgId,
        quest_day: data.quest_day,
        start_date: data.start_date ? Math.ceil(new Date(data.start_date).getTime() / 1000) : "",
        created_on: createdOn,
        completed_by: Number(0),
        launch_day_period: Number(data.launch_day_period),
        quest_category: data.quest_category,
        allowed_users: data.allowed_users,
        allowed_users_reward: data.allowed_users_reward,
        eligibility: data.eligibility,
        total_rewards: Number(data.total_rewards),
        claimed_rewards: Number(0),
      };
      const _quest = db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId);
      const _questIndResponse = await _quest.create(questIndObj);
      if (_questIndResponse) {
        // Create Quest Public Data.
        const questIndObjPub = {
          doc_type: "Individual",
          quest_type: data.type.trim(),
          title: data.title,
          tags: data.tags,
          cta_title: data.cta_title,
          description: data.description,
          rewards_type: data.rewards_type,
          max_rewards: Number(data.reward),
          expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
          actions: _actionsAggObject,
          org_id: _orgId,
          quest_day: data.quest_day,
          start_date: data.start_date ? Math.ceil(new Date(data.start_date).getTime() / 1000) : "",
          created_on: createdOn,
          completed_by: Number(0),
          launch_day_period: Number(data.launch_day_period),
          quest_category: data.quest_category,
        };
        const _questPub = db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("public").doc("public");
        const _questIndPubResponse = await _questPub.create(questIndObjPub);
        if (_questIndPubResponse) {
          // Create Action Individual Documents
          let actionDocSuccess = 0;
          for (let i = 0; i < _actionIndObjects.length; i++) {
            const _action = await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).create(_actionIndObjects[i]);
            if (_action) {
              actionDocSuccess += 1;
            } else {
              if (i > 0) {
                for (let j=1; j < i; j++) {
                  await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((j).toString()).delete();
                }
                break;
              }
            }
          }
          if (actionDocSuccess == _actionIndObjects.length) {
            // Create Action Public Individual Documents
            let actionPublicDocSuccess = 0;
            for (let i = 0; i < _actionPublicObjects.length; i++) {
              const _actionPublic = await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").create(_actionPublicObjects[i]);
              if (_actionPublic) {
                actionPublicDocSuccess += 1;
              } else {
                if (i > 0) {
                  for (let j=1; j < i; j++) {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").delete();
                  }
                  break;
                }
              }
            }
            if (actionPublicDocSuccess === _actionPublicObjects.length) {
              // Creating aggregate document
              const _aggregateId = Number(Math.floor((Number(org?.listed_quests) + 1)/20).toFixed(0)) + 1;

              // Check if an aggregate document exists
              const _questAgg = await db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString()).get();
              if (_questAgg.exists) {
                const oldQuestAggData: any = _questAgg.data();
                const questAggUpdateObj = {
                  title: data.title,
                  quest_type: data.type.trim(),
                  tags: data.tags,
                  rewards_type: data.rewards_type,
                  max_rewards: Number(data.reward),
                  expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
                  start_date: data.start_date ? Math.ceil(new Date(data.start_date).getTime() / 1000) : "",
                  created_on: createdOn,
                  completed_by: Number(0),
                  launch_day_period: Number(data.launch_day_period),
                  quest_category: data.quest_category,
                  image_url: data.image_url.trim(),
                  allowed_users: data.allowed_users,
                };
                const temp: any = {};
                temp[`quests.${_questId}`] = questAggUpdateObj;
                const res = await db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString()).update(
                    temp
                );
                if (res) {
                  // Update Organisation Listed Tasks
                  const orgUpdate = await db.collection("xorgs").doc(_orgId).update(
                      {
                        "listed_quests": FieldValue.increment(1),
                      }
                  );
                  if (orgUpdate) {
                    return {success: true, message: "Success: Quest Created"};
                  } else {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString()).update(oldQuestAggData);
                    for (let i = 0; i < _actionIndObjects.length; i++) {
                      await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).delete();
                    }
                    for (let i = 0; i < _actionPublicObjects.length; i++) {
                      await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").delete();
                    }
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString()).update(
                        oldQuestAggData
                    );
                    await _quest.delete();
                    return {success: false, message: "ERROR: Creating Quest!"};
                  }
                } else {
                  for (let i = 0; i < _actionIndObjects.length; i++) {
                    await db.collection("xorgs").doc(_orgId).collection("actions").doc((i+1).toString()).delete();
                  }
                  for (let i = 0; i < _actionPublicObjects.length; i++) {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").delete();
                  }
                  await _quest.delete();
                  return {success: false, message: "ERROR: Creating Quest!"};
                }
              } else {
                const temp: any = {};
                temp[`${_questId}`] = {
                  title: data.title,
                  quest_type: data.type.trim(),
                  tags: data.tags,
                  rewards_type: data.rewards_type,
                  max_rewards: Number(data.reward),
                  expiry: Math.ceil(new Date(data.expiry).getTime() / 1000),
                  start_date: data.start_date ? Math.ceil(new Date(data.start_date).getTime() / 1000) : "",
                  created_on: createdOn,
                  completed_by: Number(0),
                  launch_day_period: Number(data.launch_day_period),
                  quest_category: data.quest_category,
                  image_url: data.image_url.trim(),
                };
                const questAggObj = {
                  docType: "Aggregate",
                  quests: temp,
                };
                const taskAgg = db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString());
                const res = await taskAgg.create(questAggObj);
                if (res) {
                  // Update Organisation Listed Tasks
                  const orgUpdate = await db.collection("xorgs").doc(_orgId).update(
                      {
                        "listed_quests": FieldValue.increment(1),
                      }
                  );
                  if (orgUpdate) {
                    return {success: true, message: "Success: Quest Created"};
                  } else {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc("quest_agg_"+_aggregateId.toString()).delete();
                    for (let i = 0; i < _actionIndObjects.length; i++) {
                      await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).delete();
                    }
                    for (let i = 0; i < _actionPublicObjects.length; i++) {
                      await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").delete();
                    }
                    await _quest.delete();
                    return {success: false, message: "ERROR: Creating Quest!"};
                  }
                } else {
                  for (let i = 0; i < _actionIndObjects.length; i++) {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).delete();
                  }
                  for (let i = 0; i < _actionPublicObjects.length; i++) {
                    await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).collection("public").doc("public").delete();
                  }
                  await _quest.delete();
                  return {success: false, message: "ERROR: Creating Quest!"};
                }
              }
            } else {
              for (let i = 0; i < _actionIndObjects.length; i++) {
                await db.collection("xorgs").doc(_orgId).collection("quests").doc(_questId).collection("actions").doc((i+1).toString()).delete();
              }
              await _quest.delete();
              return {success: false, message: "ERROR: Creating Quest!"};
            }
          } else {
            await _quest.delete();
            return {success: false, message: "ERROR: Creating Quest!"};
          }
        }
        await _quest.delete();
        return {success: false, message: "ERROR: Creating Quest!"};
      } else {
        return {success: false, message: "ERROR: Creating Quest!"};
      }
    }
    return {success: false, message: "ERROR: Organisation doesn't exist."};
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
