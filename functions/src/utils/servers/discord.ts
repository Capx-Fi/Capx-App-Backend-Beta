/* eslint-disable max-len */
import express from "express";
import * as functions from "firebase-functions";
import {exportSecret} from "../config/config";
import * as bodyParser from "body-parser";
import fetch from "node-fetch";
import qs from "qs";
import cors from "cors";
import {linkDiscord} from "../helpers/linkDiscord";
import {auth, db} from "../init/init";

export const server = express();

server.use(bodyParser.json());
server.use(cors({origin: true}));

server.get("/signin", async (req: any, res: any) => {
  const secrets: any = await exportSecret();
  res.redirect(secrets.DISCORD_SIGNIN.auth_redirect_uri);
});

server.get("/signin-auth", async (req: any, res: any) => {
  if (req.query.code) {
    const code = req.query.code.toString().trim();
    const secrets: any = await exportSecret();
    const data = qs.stringify({
      "client_id": secrets.DISCORD_SIGNIN.client_id,
      "client_secret": secrets.DISCORD_SIGNIN.client_secret,
      "grant_type": secrets.DISCORD_SIGNIN.grant_type,
      "code": code,
      "redirect_uri": secrets.DISCORD_SIGNIN.redirect_uri,
    });
    try {
      functions.logger.info("QS Stringify: \n", data);
      const authorize = await fetch(
          "https://discord.com/api/oauth2/token",
          {
            method: "POST",
            body: data,
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
          }
      );
      const authResponse: any = await authorize.json();
      console.log("Auth Response:", authResponse);
      if (authResponse.token_type && authResponse.access_token) {
        try {
          const userDetails = await fetch(
              "https://discord.com/api/users/@me",
              {
                method: "GET",
                headers: {authorization: `${authResponse.token_type} ${authResponse.access_token}`},
              }
          );
          const user: any = await userDetails.json();
          if (user.id && user.username && user.discriminator && user.email && user.verified) {
            try {
              // Create a Firebase account and get the Custom Auth Token.
              const firebaseToken = await createFirebaseAccount(user.id, user.username, user.discriminator, user.email, user.verified);
              if (firebaseToken) {
                res.status(200).json({token: firebaseToken});
              } else {
                await (await import("../tracker/track")).registerError(
                  user?.id ? user.id : "Unknown User",
                  "discord-SignIn",
                  {user: user},
                  "NO TOKEN",
                  "Token Generation Failed."
                );
                res.status(400).json({error: "Token Generation Failed"});
              }
            } catch (err) {
              functions.logger.error("Creating Custom Token Error: ", err);
              await (await import("../tracker/track")).registerError(
                user?.id ? user.id : "Unknown User",
                "discord-SignIn",
                {user: user},
                "NO TOKEN",
                `Creating Custom Token Error: Something is broken. \nDetails: ${err}.`
              );
              res.status(400).json({error: "Error creating user token."});
            }
          } else {
            functions.logger.error("UserDetails Fetch Error: ", user);
            await (await import("../tracker/track")).registerError(
              user?.id ? user.id : "Unknown User",
              "discord-SignIn",
              {user: user},
              "NO TOKEN",
              "UserDetails Fetch Error:"
            );
            res.status(400).json({error: "ERROR: Unabel to fetch user details."});
          }
        } catch (err) {
          functions.logger.error("UserDetails Fetch Error:", err);
          await (await import("../tracker/track")).registerError(
              "Unknown User",
              "discord-SignIn",
              code,
              "NO TOKEN",
              `UserDetails Fetch Error. \nDetails: ${err}.`
          );
          res.status(400).json({error: "ERROR: Unabel to fetch user details."});
        }
      } else {
        functions.logger.error("Invalid Response from Discord Auth", authResponse);
        await (await import("../tracker/track")).registerError(
            "Unknown User",
            "discord-SignIn",
            "",
            "NO TOKEN",
            "Invalid Response from Discord Auth"+authResponse
        );
        res.status(400).json({error: "ERROR: Authorization Failed."});
      }
    } catch (err) {
      functions.logger.error("Invalid Response from Discord Auth", err);
      await (await import("../tracker/track")).registerError(
          "Unknown User",
          "discord-SignIn",
          code,
          "NO TOKEN",
          `Invalid Response from Discord Auth. \nDetails: ${err}.`
      );
      res.status(400).json({error: "ERROR: Authorization Failed."});
    }
  } else {
    await (await import("../tracker/track")).registerError(
        "Unknown User",
        "discord-SignIn",
        "",
        "NO TOKEN",
        "ERROR: Invalid Request. Missing `code`"
    );
    res.status(400).json({error: "ERROR: Invalid Request. Missing `code`."});
  }
});

server.get("/signup", async (req: any, res: any) => {
  const secrets: any = await exportSecret();
  res.redirect(secrets.DISCORD_SIGNUP.auth_redirect_uri);
});

server.get("/signup-auth", async (req: any, res: any) => {
  if (req.query.code) {
    const code = req.query.code.toString().trim();
    const secrets: any = await exportSecret();
    const data = qs.stringify({
      "client_id": secrets.DISCORD_SIGNUP.client_id,
      "client_secret": secrets.DISCORD_SIGNUP.client_secret,
      "grant_type": secrets.DISCORD_SIGNUP.grant_type,
      "code": code,
      "redirect_uri": secrets.DISCORD_SIGNUP.redirect_uri,
    });
    try {
      functions.logger.info("QS Stringify: \n", data);
      const authorize = await fetch(
          "https://discord.com/api/oauth2/token",
          {
            method: "POST",
            body: data,
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
          }
      );
      const authResponse: any = await authorize.json();
      if (authResponse.token_type && authResponse.access_token) {
        try {
          const userDetails = await fetch(
              "https://discord.com/api/users/@me",
              {
                method: "GET",
                headers: {authorization: `${authResponse.token_type} ${authResponse.access_token}`},
              }
          );
          const user: any = await userDetails.json();
          if (user.id && user.username && user.discriminator && user.email && user.verified) {
            try {
              // Create a Firebase account and get the Custom Auth Token.
              const firebaseToken = await createFirebaseAccount(user.id, user.username, user.discriminator, user.email, user.verified);
              if (firebaseToken) {
                res.status(200).json({token: firebaseToken});
              } else {
                await (await import("../tracker/track")).registerError(
                  user?.id ? user.id : "Unknown User",
                  "discord-SignUp",
                  {user: user},
                  "NO TOKEN",
                  "Token Generation Failed."
                );
                res.status(400).json({error: "Token Generation Failed"});
              }
            } catch (err) {
              functions.logger.error("Creating Custom Token Error: ", err);
              await (await import("../tracker/track")).registerError(
                user?.id ? user.id : "Unknown User",
                "discord-SignUp",
                {user: user},
                "NO TOKEN",
                `Creating Custom Token Error: Something is broken. \nDetails: ${err}.`
              );
              res.status(400).json({error: "Error creating user token."});
            }
          } else {
            functions.logger.error("UserDetails Fetch Error: ", user);
            await (await import("../tracker/track")).registerError(
              user?.id ? user.id : "Unknown User",
              "discord-SignUp",
              {user: user},
              "NO TOKEN",
              "UserDetails Fetch Error:"
            );
            res.status(400).json({error: "ERROR: Unabel to fetch user details."});
          }
        } catch (err) {
          functions.logger.error("UserDetails Fetch Error:", err);
          await (await import("../tracker/track")).registerError(
              "Unknown User",
              "discord-SignUp",
              code,
              "NO TOKEN",
              `UserDetails Fetch Error. \nDetails: ${err}.`
          );
          res.status(400).json({error: "ERROR: Unabel to fetch user details."});
        }
      } else {
        functions.logger.error("Invalid Response from Discord Auth", authResponse);
        await (await import("../tracker/track")).registerError(
            "Unknown User",
            "discord-SignUp",
            "",
            "NO TOKEN",
            "Invalid Response from Discord Auth"+authResponse
        );
        res.status(400).json({error: "ERROR: Authorization Failed."});
      }
    } catch (err) {
      functions.logger.error("Invalid Response from Discord Auth", err);
      await (await import("../tracker/track")).registerError(
          "Unknown User",
          "discord-SignUp",
          code,
          "NO TOKEN",
          `Invalid Response from Discord Auth. \nDetails: ${err}.`
      );
      res.status(400).json({error: "ERROR: Authorization Failed."});
    }
  } else {
    await (await import("../tracker/track")).registerError(
        "Unknown User",
        "discord-SignUp",
        "",
        "NO TOKEN",
        "ERROR: Invalid Request. Missing `code`"
    );
    res.status(400).json({error: "ERROR: Invalid Request. Missing `code`."});
  }
});

server.get("/link", async (req: any, res: any) => {
  const secrets: any = await exportSecret();
  res.redirect(secrets.DISCORD_LINK.auth_redirect_uri);
});

server.get("/link-auth", async (req: any, res: any) => {
  try {
    const secrets: any = await exportSecret();
    const jwt = req.headers.authorization.substring(7);
    console.log("JWT Token Received: ", jwt);
    if (jwt) {
      try {
        const jwtPayload = await auth.verifyIdToken(jwt);
        if (jwtPayload.uid) {
          if (req.query.code) {
            const code = req.query.code.toString().trim();
            const data = qs.stringify({
              "client_id": secrets.DISCORD_LINK.client_id,
              "client_secret": secrets.DISCORD_LINK.client_secret,
              "grant_type": secrets.DISCORD_LINK.grant_type,
              "code": code,
              "redirect_uri": secrets.DISCORD_LINK.redirect_uri,
            });
            try {
              functions.logger.info("QS Stringify: \n", data);
              const authorize = await fetch(
                  "https://discord.com/api/oauth2/token",
                  {
                    method: "POST",
                    body: data,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                  }
              );
              const authResponse: any = await authorize.json();
              if (authResponse.token_type && authResponse.access_token) {
                try {
                  const userDetails = await fetch(
                      "https://discord.com/api/users/@me",
                      {
                        method: "GET",
                        headers: {authorization: `${authResponse.token_type} ${authResponse.access_token}`},
                      }
                  );
                  const user: any = await userDetails.json();
                  if (user.id && user.username && user.discriminator && user.email && user.verified) {
                    const updateUser = await linkDiscord(jwtPayload.uid, user.id, user.username, user.discriminator);
                    if (updateUser.success) {
                      try {
                        // Create a Firebase account and get the Custom Auth Token.
                        const response = await linkFirebaseAccount(jwtPayload.uid, user.id, user.username, user.discriminator, user.email, user.verified);
                        if (response) {
                          res.status(200).json({result: {success: true}});
                        } else {
                          await (await import("../tracker/track")).registerError(
                            jwt?.uid ? jwt.uid : "Unknown User",
                            "discord-Link",
                            req.query?.code ? req.query.code : "NO CODE",
                            req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                            "Error Updating Discord in AUTH"+user
                          );
                          res.status(400).json({result: {success: false, error: "Error Updating User Data."}});
                        }
                      } catch (err) {
                        functions.logger.error("ERROR: Updating Discord Account in AUTH: ", err);
                        await (await import("../tracker/track")).registerError(
                          jwt?.uid ? jwt.uid : "Unknown User",
                          "discord-Link",
                          req.query?.code ? req.query.code : "NO CODE",
                          req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                          `Updating Discord Account in AUTH. \nDetails: ${err}.`
                        );
                        res.status(400).json({result: {success: false, error: "Updating Discord Account in AUTH."}});
                      }
                    } else {
                      functions.logger.error("Error updating user.", updateUser.error);
                      await (await import("../tracker/track")).registerError(
                        jwt?.uid ? jwt.uid : "Unknown User",
                        "discord-Link",
                        req.query?.code ? req.query.code : "NO CODE",
                        req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                        "Error linking user"+updateUser.error
                      );
                      res.status(400).json({result: {success: false, error: "ERROR: Unable to update user."}});
                    }
                  } else {
                    functions.logger.error("UserDetails Fetch Error: ", user);
                    await (await import("../tracker/track")).registerError(
                      jwt?.uid ? jwt.uid : "Unknown User",
                      "discord-Link",
                      req.query?.code ? req.query.code : "NO CODE",
                      req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                      "UserDetails Fetch Error:"+user
                    );
                    res.status(400).json({result: {success: false, error: "ERROR: Unabel to fetch user details."}});
                  }
                } catch (err) {
                  functions.logger.error("UserDetails Fetch Error:", err);
                  await (await import("../tracker/track")).registerError(
                    jwt?.uid ? jwt.uid : "Unknown User",
                    "discord-Link",
                    req.query?.code ? req.query.code : "NO CODE",
                    req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                    `Unable to fetch user details. \nDetails: ${err}.`
                  );
                  res.status(400).json({result: {success: false, error: "ERROR: Unabel to fetch user details."}});
                }
              } else {
                functions.logger.error("Invalid Response from Discord Auth", authResponse);
                await (await import("../tracker/track")).registerError(
                  jwt?.uid ? jwt.uid : "Unknown User",
                  "discord-Link",
                  req.query?.code ? req.query.code : "NO CODE",
                  req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                  "Invalid Response from Discord Auth"+authResponse
                );
                res.status(400).json({result: {success: false, error: "ERROR: Authorization Failed."}});
              }
            } catch (err) {
              functions.logger.error("Invalid Response from Discord Auth", err);
              await (await import("../tracker/track")).registerError(
                jwt?.uid ? jwt.uid : "Unknown User",
                "discord-Link",
                req.query?.code ? req.query.code : "NO CODE",
                req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
                `Invalid Response from Discord Auth. \nDetails: ${err}.`
              );
              res.status(400).json({result: {success: false, error: "ERROR: Authorization Failed."}});
            }
          } else {
            await (await import("../tracker/track")).registerError(
              jwt?.uid ? jwt.uid : "Unknown User",
              "discord-Link",
              req.query?.code ? req.query.code : "NO CODE",
              req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
              "Invalid Request. Missing `code`"
            );
            res.status(400).json({result: {success: false, error: "ERROR: Invalid Request. Missing `code`."}});
          }
        } else {
          functions.logger.error("Error JWT payload doesn't contain `UID`");
          await (await import("../tracker/track")).registerError(
            jwt?.uid ? jwt.uid : "Unknown User",
            "discord-Link",
            req.query?.code ? req.query.code : "NO CODE",
            req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
            "Error JWT payload doesn't contain UID"
          );
          res.status(400).json({result: {success: false, error: "ERROR: Invalid Token"}});
        }
      } catch (err) {
        functions.logger.error("Error Validating JWT", err);
        await (await import("../tracker/track")).registerError(
          jwt?.uid ? jwt.uid : "Unknown User",
          "discord-Link",
          req.query?.code ? req.query.code : "NO CODE",
          req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
          `ERROR: Invalid Token. \nDetails: ${err}.`
        );
        res.status(400).json({result: {success: false, error: "ERROR: Invalid Token"}});
      }
    } else {
      await (await import("../tracker/track")).registerError(
        jwt?.uid ? jwt.uid : "Unknown User",
        "discord-Link",
        req.query?.code ? req.query.code : "NO CODE",
        req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
        "ERROR: Invalid Request. Missing / Invalid authorization header."
      );
      res.status(400).json({result: {success: false, error: "ERROR: Invalid Request. Missing / Invalid `authorization` header."}});
    }
  } catch (err) {
    functions.logger.error("Error Processing Request:", err);
    await (await import("../tracker/track")).registerError(
        "Unknown User",
        "discord-Link",
      req.query?.code ? req.query.code : "NO CODE",
      req.headers?.authorization ? req.headers.authorization.substring(7) : "Missing Token.",
      `ERROR: Invalid Request. Missing / Invalid authorization header. \nDetails: ${err}.`
    );
    res.status(400).json({result: {success: false, error: "ERROR: Unable to Process request"}});
  }
});

async function createFirebaseAccount(discordID: string, username: string, discriminator: string, email: string, verified: boolean) {
  try {
    let uid = discordID;

    // Check if the discord ID is linked to an account.
    const userDocs = await db.collection("xusers").where("socials.discord_id", "==", discordID).get();
    console.log(userDocs.size);
    if (userDocs.size === 1) {
      uid = userDocs.docs[0].id;
    } else if (userDocs.size > 1) {
      functions.logger.error("Error Multiple Users Found with same Discord ID. User Count:", userDocs.size);
      return null;
    } else if (userDocs.size === 0) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        const updateUser = await linkDiscord(uid, discordID, username, discriminator);
        if (!updateUser.success) {
          return null;
        }
      } catch (error: any) {
        if (error.code == "auth/user-not-found") {
          await auth.createUser({
            uid: uid,
            displayName: username,
            email: email,
            emailVerified: verified,
          });
        } else {
          console.log("Error: ", error);
          return null;
        }
      }
    }

    // Set custom claims on the user.
    await auth.setCustomUserClaims(uid, {
      discord: {
        id: discordID,
        username: username,
        discriminator: discriminator,
        email: email,
      },
    });

    // Wait for all async tasks to complete, then generate and return a custom auth token.
    // Create a Firebase custom auth token.
    const token = await auth.createCustomToken(uid);
    functions.logger.log("Created Custom Token for UID: ", uid, "\nDiscord ID: ", discordID);
    return token;
  } catch (err) {
    functions.logger.error("Error Creating custom token.", err);
    return null;
  }
}

async function linkFirebaseAccount(uid: string, discordID: string, username: string, discriminator: string, email: string, verified: boolean) {
  try {
    // Set custom claims on the user.
    await auth.setCustomUserClaims(uid, {
      discord: {
        id: discordID,
        username: username,
        discriminator: discriminator,
        email: email,
      },
    });
    // Create a Firebase custom auth token.
    return true;
  } catch (err) {
    functions.logger.error("Error Creating custom token.", err);
    return false;
  }
}
