/* eslint-disable max-len */
import express from "express";
import * as functions from "firebase-functions";
import {getUserCredentials} from "../auth/middleware";
import * as bodyParser from "body-parser";
import cors from "cors";

export const server = express();

server.use(bodyParser.json());
server.use(cors({origin: true}));
server.use(getUserCredentials);

server.get("/", async (req: any, res: any) => {
  if (!req["jwt"]) {
    functions.logger.error("UNAUTHENTICATED Request.");
    res.status(401).json({"result": {"message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
  } else {
    res.status(200).json({"result": {"message": "Server Ready!", "status": "UP"}});
  }
});

server.get("/checkIfUsernameAvailable", async (req: any, res: any) => {
  functions.logger.info("CheckIfUsername Available");
  try {
    if (!req["jwt"]) {
      await (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "checkIfUsernameAvailable",
        req.query,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (req.query.username) {
        const _username = req.query.username.trim().replace(/[^a-z0-9_]/gi, "").toLowerCase();
        if (_username.length > 4) {
          const result = await (await import("../helpers/checkIfUsernameAvailable")).checkIfUsernameAvailable(_username);
          if (result) {
            res.status(200).json({result: {success: true, message: "SUCCESS: Username Available"}});
          } else {
            await (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "checkIfUsernameAvailable",
              req.query,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              "Username NOT Available"
            );
            res.status(400).json({result: {success: false, message: "ERROR: Username NOT Available"}});
          }
        } else {
          await (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "checkIfUsernameAvailable",
            req.query,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "Username should be more than `4` characters"
          );
          res.status(400).json({result: {success: false, message: "Username should be more than `4` characters", status: "ERROR"}});
        }
      } else {
        await (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "checkIfUsernameAvailable",
          req.query,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Missing Parameter `username`."
        );
        res.status(400).json({result: {success: false, message: "Missing Parameter `username`.", status: "ERROR"}});
      }
    }
  } catch (err) {
    await (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "checkIfUsernameAvailable",
      req.query,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - x_checkIfUsernameAvailable :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/completeAction", async (req: any, res: any) => {
  functions.logger.info("completeAction");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "completeAction",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (req.body.data.action_order_id) {
        if (req.body.data.action_order_id.trim().length != 0) {
          const result = await (await import("../helpers/completeAction/completeQuestAction")).completeQuestAction(req["jwt"], req.body.data);
          if (result.success) {
            res.status(200).json({result: {success: true, message: result.message}});
          } else {
            (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "completeAction",
              req.body.data,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              result.error
            );
            res.status(400).json({result: {success: false, message: result.message}});
          }
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "completeAction",
            req.body.data,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "Invalid value for `action_order_id`"
          );
          res.status(400).json({result: {success: false, message: "ERROR: Invalid value for `action_order_id`"}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "completeAction",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Missing parameter `action_order_id`"
        );
        res.status(400).json({result: {success: false, message: "ERROR: Missing parameter `action_order_id`."}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "completeAction",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - x_completeAction :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/claimReward", async (req: any, res: any) => {
  functions.logger.info("claimReward");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "claimReward",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      const _data : any = {};
      if (req.body.data.quest_order_id) {
        if (req.body.data.quest_order_id.trim().length != 0) {
          _data["quest_order_id"] = req.body.data.quest_order_id.trim();
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "claimReward",
            req.body.data,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "Invalid value for `questId`"
          );
          res.status(400).json({result: {success: false, message: "ERROR: Invalid value for `questId`"}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "claimReward",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Missing parameter `quest_order_id`"
        );
        res.status(400).json({result: {success: false, message: "ERROR: Missing parameter `quest_order_id`"}});
      }
      const result = await (await import("../helpers/claimRewards/claimQuestReward")).claimReward(req["jwt"], _data);
      if (result.success) {
        res.status(200).json({result: {success: true, message: result.message}});
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "claimReward",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    functions.logger.error("Error - x_completeAction :\n", err);
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "claimReward",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/createOrg", async (req: any, res: any) => {
  functions.logger.info("createOrg");
  try {
    if (!req["jwt"]) {
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (req.body.data.name && req.body.data.description && req.body.data.tags && req.body.data.website) {
        if (req.body.data.tags.length != 0 && req.body.data.name.trim().length > 2 && req.body.data.description.trim().length > 26 && req.body.data.website.trim().length != 0) {
          const _data : any = {
            tags: req.body.data.tags,
            name: req.body.data.name.trim(),
            description: req.body.data.description.trim(),
            website: req.body.data.website.trim(),
          };
          const result = await (await import("../organisation/createOrg")).createOrg(req["jwt"], _data);
          if (result.success) {
            res.status(201).json({result: {success: true, message: result.message}});
          } else {
            res.status(400).json({result: {success: false, message: result.message}});
          }
        } else {
          res.status(400).json({result: {success: false, message: "ERROR: One (or) more parameters inputs are Invalid"}});
        }
      } else {
        res.status(400).json({result: {success: false, message: "ERROR: Missing one (or) more parameters from `name`,`description`, `tags`, `website`."}});
      }
    }
  } catch (err) {
    functions.logger.error("Error - x_createOrg :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/createQuest", async (req: any, res: any) => {
  functions.logger.info("createQuest");
  try {
    if (!req["jwt"]) {
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (
        req.body.data.title &&
              req.body.data.tags &&
              req.body.data.cta_title &&
              req.body.data.description &&
              req.body.data.rewards_type &&
              req.body.data.reward &&
              req.body.data.actions &&
              req.body.data.expiry &&
              req.body.data.quest_day &&
              req.body.data.type &&
              req.body.data.quest_category &&
              req.body.data.image_url &&
              req.body.data.allowed_users &&
              req.body.data.eligibility &&
              req.body.data.total_rewards
      ) {
        if (!req.body.data.quest_day.includes("DAY")) {
          res.status(400).json({result: {success: false, message: "ERROR: Invalid Parameter value : `quest_day`"}});
        } else {
          try {
            if (typeof(req.body.data.launch_day_period) !== typeof(Number(0))) {
              res.status(400).json({result: {success: false, message: "ERROR: `launch_day_period` should be a number."}});
            } else {
              if (Number(req.body.data.launch_day_period) < 0) {
                res.status(400).json({result: {success: false, message: "ERROR: Invalid Parameter value : `launch_day_period`"}});
              } else {
                let _expiryDate;
                try {
                  _expiryDate = new Date(req.body.data.expiry.trim());
                  if (
                    Object.values((await import("../enums/questType")).QuestType).includes(req.body.data.type.trim()) &&
                        req.body.data.title.length != 0 &&
                        req.body.data.tags.length != 0 &&
                        req.body.data.cta_title.length != 0 &&
                        req.body.data.description.length != 0 &&
                        Object.values((await import("../enums/rewardType")).RewardType).includes(req.body.data.rewards_type.trim()) &&
                        req.body.data.reward.length != 0 &&
                        req.body.data.actions.length != 0 &&
                        req.body.data.total_rewards.trim().length != 0 &&
                        req.body.data.image_url.trim().length != 0 &&
                        _expiryDate.getTime() >= Date.now() &&
                        Object.values((await import("../enums/questCategoryType")).QuestCategoryType).includes(req.body.data.quest_category.trim())
                  ) {
                    // Validate actions structure.
                    let actionFlag = 0;
                    for (let i=0; i < req.body.data.actions.length; i++) {
                      const action = req.body.data.actions[i];
                      if ((await import("../validators/validateActionStruct")).validateActionStruct(action)) {
                        actionFlag += 1;
                      }
                    }
                    if (actionFlag != req.body.data.actions.length) {
                      res.status(400).json({result: {success: false, message: "ERROR: Invalid `action` object"}});
                    } else {
                      const _data : any = {
                        title: req.body.data.title.trim(),
                        tags: req.body.data.tags,
                        cta_title: req.body.data.cta_title.trim(),
                        description: req.body.data.description.trim(),
                        rewards_type: req.body.data.rewards_type,
                        reward: req.body.data.reward,
                        actions: req.body.data.actions,
                        expiry: req.body.data.expiry.trim(),
                        quest_day: req.body.data.quest_day.trim(),
                        type: req.body.data.type,
                        launch_day_period: req.body.data.launch_day_period,
                        quest_category: req.body.data.quest_category.trim(),
                        image_url: req.body.data.image_url.trim(),
                        allowed_users: req.body.data?.allowed_users,
                        allowed_users_reward: req.body.data?.allowed_users_reward ? req.body.data.allowed_users_reward : {},
                        eligibility: req.body.data.eligibility,
                        total_rewards: req.body.data.total_rewards.trim(),
                      };
                      if (req.body.data.start_date) {
                        _data["start_date"] = req.body.data.start_date.trim();
                      }
                      const result = await (await import("../organisation/createQuest")).createQuest(req["jwt"], _data);
                      if (result.success) {
                        res.status(201).json({result: {success: true, message: result.message}});
                      } else {
                        res.status(400).json({result: {success: false, message: result.message}});
                      }
                    }
                  } else {
                    res.status(400).json({result: {success: false, message: "ERROR: One (or) more parameters inputs are Invalid!"}});
                  }
                } catch (err) {
                  functions.logger.error("Error:\n", err);
                  res.status(400).json({result: {success: false, message: "ERROR: Invalid parameter value : `expiry`"}});
                }
              }
            }
          } catch (err) {
            functions.logger.error("Error:\n", err);
            res.status(400).json({result: {success: false, message: "ERROR: Missing Parameter : `launch_day_period`"}});
          }
        }
      } else {
        res.status(400).json({result: {success: false, message: "ERROR: Missing one (or) more parameters from `title`, `description`, `type`, `rewards_type`, `cta_title`, `tags`, `reward`, `expiry`, `launch_day_period`, `eligibility` (or) `actions`."}});
      }
    }
  } catch (err) {
    functions.logger.error("Error - x_createQuest :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/createUser", async (req: any, res: any) => {
  functions.logger.info("createUser");
  try {
    if (!req["jwt"]) {
      functions.logger.error("UNAUTHENTICATED Request.");
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "createUser",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (
        req.body.data.username &&
          req.body.data.username.trim().replace(/[^a-z0-9_]/gi, "").toLowerCase().length > 4 &&
          req.body.data.invite_code.toUpperCase().length === 5 &&
          req.body.data.invite_code
      ) {
        const _data: any = {
          username: req.body.data.username.trim().replace(/[^a-z0-9_]/gi, "").toLowerCase(),
          inviteCode: req.body.data.invite_code.toUpperCase(),
        };

        if (req.body.data.name) {
          _data["name"] = req.body.data.name.trim();
        }

        const result = await (await import("../users/createUser")).createUser(req["jwt"], _data);
        if (result.success) {
          res.status(201).json({result: {success: true, message: result.message}});
        } else {
          if (result.message === "ERROR: Invite code is being used by someone else.") {
            (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "createUser",
              req.body.data,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              result.error
            );
            res.status(200).json({result: {success: false, message: result.message}});
          } else {
            (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "createUser",
              req.body.data,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              result.error
            );
            res.status(400).json({result: {success: false, message: result.message}});
          }
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "createUser",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Invalid / Missing one (or) more query parameters `username`, `invite_code`."
        );
        res.status(400).json({result: {success: false, message: "ERROR: Invalid / Missing one (or) more query parameters `username`, `invite_code`."}});
      }
    }
  } catch (err) {
    await (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "createUser",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - x_createUser :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/registerForQuest", async (req: any, res: any) => {
  functions.logger.info("registerForQuest");
  try {
    if (!req["jwt"]) {
      functions.logger.error("UNAUTHENTICATED Request.");
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "registerForQuest",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (req.body.data.questId) {
        if (req.body.data.questId.trim().length != 0) {
          const _data : any = {
            questId: req.body.data.questId.trim(),
          };
          const result = await (await import("../helpers/registerForQuest/registerForQuest")).registerForQuest(req["jwt"], _data);
          if (result.success) {
            res.status(200).json({result: {success: true, message: result.message, quest_order_id: result?.quest_order_id, quest_status: result?.quest_status}});
          } else {
            if (result.message === "ERROR: User already Registered!") {
              res.status(200).json({result: {success: false, message: result.message, quest_order_id: result?.quest_order_id, quest_status: result?.quest_status}});
            } else {
              (await import("../tracker/track")).registerError(
                req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
                "registerForQuest",
                req.body.data,
                req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
                result.error
              );
              res.status(400).json({result: {success: false, message: result.message}});
            }
          }
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "registerForQuest",
            req.body.data,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "Invalid value for `questId`"
          );
          res.status(400).json({result: {success: false, message: "ERROR: Invalid value for `questId`"}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "registerForQuest",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Missing parameter `questId`"
        );
        res.status(400).json({result: {success: false, message: "ERROR: Missing parameter `questId`."}});
      }
    }
  } catch (err) {
    functions.logger.error("Error - x_registerForQuest :\n", err);
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "registerForQuest",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/linkTwitter", async (req: any, res: any) => {
  functions.logger.info("linkTwitter function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "linkTwitter",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      const result = (await (await import("../helpers/linkTwitter/linkTwitter")).linkTwitter(req["jwt"]));
      if (result.success) {
        res.status(200).json({result: {success: true, message: result.message}});
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "linkTwitter",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "linkTwitter",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - linkTwitter :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/linkGoogle", async (req: any, res: any) => {
  functions.logger.info("linkGoogle function");
  try {
    if (!req["jwt"]) {
      await (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "linkGoogle",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      const result = (await (await import("../users/linkGoogle")).linkGoogle(req["jwt"]));
      if (result.success) {
        res.status(200).json({result: {success: true, message: result.message}});
      } else {
        await (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "linkGoogle",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    await (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "linkGoogle",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - linkGoogle :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.post("/updateProfile", async (req: any, res: any) => {
  functions.logger.info("updateProfile function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "updateProfile",
        req.body.data,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      // Update user fullname, image, twitter_id, google_id
      if (req.body.data.image_url || req.body.data.name) {
        const result = await (await import("../helpers/updateProfile/updateUserProfile")).updateUserProfile(req["jwt"], req.body.data);
        if (result.success) {
          res.status(200).json({result: {success: true, message: result.message}});
        } else {
          (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "updateProfile",
              req.body.data,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              result.error
          );
          res.status(400).json({result: {success: false, message: result.message}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "updateProfile",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "ERROR: Missing one (or) more parameter `image_url`, `name`"
        );
        res.status(400).json({result: {success: false, message: "ERROR: Missing one (or) more parameter `image_url`, `name`"}});
      }
    }
  } catch (err) {
    functions.logger.error("Error - updateProfile :\n", err);
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "updateProfile",
      req.body.data,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.get("/getLeaderboard", async (req: any, res: any) => {
  functions.logger.info("getLeaderboard function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "getLeaderboard",
        req.query,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      let maxPositions = 10;
      const MAX_ALLOWED = 20;
      if (req.query.max_positions) {
        const positions = req.query.max_positions.trim();
        if (!Number.isNaN(Number(positions))) {
          if (Number(positions) === 0) {
            (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "getLeaderboard",
              req.query,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              "Invalid parameter value for `max_positions`"
            );
            res.status(400).json({result: {success: false, message: "Invalid parameter value for `max_positions`"}});
            return;
          }
          if (Number(positions) > MAX_ALLOWED) {
            (await import("../tracker/track")).registerError(
              req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
              "getLeaderboard",
              req.query,
              req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
              "Leaderboard can only be viewed upto 20 positions."
            );
            res.status(400).json({result: {success: false, message: "Leaderboard can only be viewed upto 20 positions."}});
            return;
          }
          maxPositions = Number(positions);
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "getLeaderboard",
            req.query,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "Invalid parameter value for `max_positions`"
          );
          res.status(400).json({result: {success: false, message: "Invalid parameter value for `max_positions`"}});
          return;
        }
      }
      const result = (await (await import("../helpers/getLeaderboard/getLeaderboardStandings")).getLeaderboardStandings(req["jwt"], maxPositions));
      if (result.success) {
        res.status(200).json({result: {success: true, message: result.message, leaderboard: result.leaderboard}});
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "getLeaderboard",
          req.query,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "getLeaderboard",
      req.query,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - getLeaderboard :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.get("/getWallet", async (req: any, res: any) => {
  functions.logger.info("fetchWalletDetails function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "fetchWalletDetails",
        req.query,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      const result = (await (await import("../helpers/getWallet/getWalletDetails")).getWalletDetails(req["jwt"]));
      if (result.success) {
        res.status(200).json({result: {success: true, message: result.message, wallet: result.wallet}});
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "fetchWalletDetails",
          req.query,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "fetchWalletDetails",
      req.query,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - fetchWalletDetails :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.get("/getRewardPool", async (req: any, res: any) => {
  functions.logger.info("getRewardPool function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "getRewardPool",
        req.query,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Rsequest."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      if (req.query.questOrderId) {
        const result = (await (await import("../helpers/getRewardPool/getRewardPool")).getRewardPool(req["jwt"], req.query));
        if (result.success) {
          res.status(200).json({result: {success: true, message: result.message, rewardPool: result.rewardPool}});
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "getRewardPool",
            req.query,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            result.error
          );
          res.status(400).json({result: {success: false, message: result.message}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "getRewardPool",
          req.body.data,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "ERROR: Missing parameter `questOrderId`"
        );
        res.status(400).json({result: {success: false, message: "ERROR: Missing parameter `questOrderId`"}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "getRewardPool",
      req.query,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - getRewardPool :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});

server.get("/getInviteProgramStats", async (req: any, res: any) => {
  functions.logger.info("getInviteProgramStats function");
  try {
    if (!req["jwt"]) {
      (await import("../tracker/track")).registerError(
        req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
        "getInviteProgramStats",
        req.query,
        req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
        "Un-Authenticated Request."
      );
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json({"result": {"success": false, "message": "Unauthenticated", "status": "UNAUTHENTICATED"}});
    } else {
      const result = (await (await import("../helpers/getInviteProgram/getInviterProgramRewards")).getInviterProgramStats(req["jwt"]));
      if (result.success) {
        const ogResult = (await (await import("../helpers/getInviteProgram/getOGInviterProgramRewards")).getOGInviterProgramStats(req["jwt"]));
        if (ogResult.success) {
          res.status(200).json({result: {
            success: true,
            message: result.message,
            inviteProgramRewards: result.inviterRewards,
            inviteProgramStats: result.inviteStats,
            ogInviteProgramRewards: ogResult.inviterRewards,
            ogInviteProgramStats: ogResult.inviteStats,
          }});
        } else {
          (await import("../tracker/track")).registerError(
            req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
            "getInviteProgramStats",
            req.query,
            req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
            "OG Fetch"+result.error
          );
          res.status(400).json({result: {success: false, message: result.message}});
        }
      } else {
        (await import("../tracker/track")).registerError(
          req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
          "getInviteProgramStats",
          req.query,
          req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
          "Normal Fetch"+result.error
        );
        res.status(400).json({result: {success: false, message: result.message}});
      }
    }
  } catch (err) {
    (await import("../tracker/track")).registerError(
      req["jwt"]?.uid ? req["jwt"]?.uid : "Unknown User",
      "getInviteProgramStats",
      req.query,
      req["jwt"]?.token_auth ? req["jwt"]?.token_auth : "Missing Token.",
      `Error Processing Request: Something is broken. \nDetails: ${err}.`
    );
    functions.logger.error("Error - getInviteProgramStats :\n", err);
    res.status(500).json({result: {success: false, message: "Error Processing Request.", status: "ERROR"}});
  }
});
