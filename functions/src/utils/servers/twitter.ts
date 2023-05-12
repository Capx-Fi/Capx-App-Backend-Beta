/* eslint-disable max-len */
import express from "express";
import * as functions from "firebase-functions";
import {getUserCredentials} from "../auth/middleware";
import {exportSecret} from "../config/config";
import * as bodyParser from "body-parser";
import fetch from "node-fetch";
import qs from "qs";
import cors from "cors";
import {auth, db} from "../init/init";

export const server = express();

server.use(bodyParser.json());
server.use(cors({origin: true}));

server.get("/", async (req: any, res: any) => {
  const secrets: any = await exportSecret();
  const TWITTER_AUTH_URL: string = secrets.TWITTER_AUTH.URL; // https://twitter.com/i/oauth2/authorize
  const TWITTER_AUTH_CLIENT_ID: string = secrets.TWITTER_AUTH.CLIENT_ID; // NUZHc3ExS3VaaU50Z0x2Y01IUzE6MTpjaQ
  const TWITTER_AUTH_REDIRECT_URI: string = secrets.TWITTER_AUTH.REDIRECT_URI; // http://localhost:3000/
  const TWITTER_AUTH_SCOPE: string = secrets.TWITTER_AUTH.SCOPE; // tweet.read%20users.read%20follows.read%20offline.access

  const REDIRECT_AUTH_URL = `${TWITTER_AUTH_URL}?response_type=code&client_id=${TWITTER_AUTH_CLIENT_ID}&redirect_uri=${TWITTER_AUTH_REDIRECT_URI}&scope=${TWITTER_AUTH_SCOPE}&state=state&code_challenge=challenge&code_challenge_method=plain`;
  res.redirect(REDIRECT_AUTH_URL);
});

server.get("/auth", async (req: any, res: any) => {
  try {
    if (req.query.code) {
      const code = req.query.code.toString().trim();
      const secrets: any = await exportSecret();

      const TWITTER_AUTH_TOKEN_URL: string = secrets.TWITTER_AUTH.TOKEN_URL; // https://api.twitter.com/2/oauth2/token

      const data = qs.stringify({
        code: code,
        grant_type: "authorization_code",
        client_id: `${secrets.TWITTER_AUTH.CLIENT_ID}`,
        redirect_uri: `${secrets.TWITTER_AUTH.REDIRECT_URI}`,
        code_verifier: "challenge",
      });

      try {
        const authorize = await fetch(
            TWITTER_AUTH_TOKEN_URL,
            {
              method: "POST",
              body: data,
              headers: {"Content-Type": "application/x-www-form-urlencoded"},
            }
        );
        const authResponse = await authorize.json();
        console.log("Auth Response", authResponse);
        if (authResponse.access_token && authResponse.refresh_token) {
          const accessToken: string = authResponse.access_token;
          const refreshToken: string = authResponse.refresh_token;

          const TWITTER_AUTH_USER_URL: string = secrets.TWITTER_AUTH.USER_URL; // https://api.twitter.com/2/users/me
          const userResponse = await getAuthUserDetails(TWITTER_AUTH_USER_URL, accessToken);
          console.log("User Response", userResponse);
          if (!userResponse?.success) {
            res.status(400).json({
              result: {
                success: userResponse?.success,
                message: userResponse?.message,
              },
            });
          } else {
            const id: any = userResponse?.twitter?.id;
            const username: any = userResponse?.twitter?.username;
            const name: any = userResponse?.twitter?.name;
            const profileImg: any = userResponse?.twitter?.profileImg;

            // Create / Check User.
            const createUser = await createTwitterFirebaseAccount(id, name, username, profileImg);
            console.log("createUser Response", createUser);
            if (!createUser.success) {
              res.status(400).json({
                result: {
                  success: createUser.success,
                  message: createUser.message,
                },
              });
            } else {
              // Add custom claims.
              const isNew: any = createUser?.isNew;
              const userId: string = createUser?.userId;
              if (isNew) {
                const addClaims = await attachTwitterClaims(id, name, userId, username);
                console.log("addClaims Response", addClaims);
                if (!addClaims.success) {
                  res.status(400).json({
                    result: {
                      success: addClaims.success,
                      message: addClaims.message,
                    },
                  });
                } else {
                  // Generate Custom Token.
                  const generateToken = await createCustomToken(userId);
                  if (!generateToken.success) {
                    res.status(400).json({
                      result: {
                        success: generateToken.success,
                        message: generateToken.message,
                      },
                    });
                  } else {
                    // Store Refresh Token.
                    const storeToken = await storeTwitterTokens(id, accessToken, refreshToken);
                    if (!storeToken.success) {
                      res.status(400).json({
                        result: {
                          success: storeToken.success,
                          message: storeToken.message,
                        },
                      });
                    } else {
                      const jwtToken: any = generateToken?.token;
                      res.status(200).json(
                          {
                            result: {
                              success: true,
                              message: "Success",
                              token: jwtToken,
                            },
                          });
                    }
                  }
                }
              } else {
                // Generate Custom Token.
                const generateToken = await createCustomToken(userId,);
                if (!generateToken.success) {
                  res.status(400).json({
                    result: {
                      success: generateToken.success,
                      message: generateToken.message,
                    },
                  });
                } else {
                  // Store Refresh Token.
                  const storeToken = await storeTwitterTokens(id, accessToken, refreshToken);
                  if (!storeToken.success) {
                    res.status(400).json({
                      result: {
                        success: storeToken.success,
                        message: storeToken.message,
                      },
                    });
                  } else {
                    const jwtToken: any = generateToken?.token;
                    res.status(200).json(
                        {
                          result: {
                            success: true,
                            message: "Success",
                            token: jwtToken,
                          },
                        });
                  }
                }
              }
            }
          }
        } else {
          res.status(400).json({
            result: {
              success: false,
              message: "ERROR: Invalid Response from Twitter Auth.",
            },
          });
        }
      } catch (err) {
        functions.logger.error("Invalid Response from Twitter Auth", err);
        res.status(400).json({
          result: {
            success: false,
            message: "ERROR: Invalid Response from Twitter Auth.",
          },
        });
      }
    } else {
      res.status(400).json({
        result: {
          success: false,
          message: "Query Parameter `code` missing.",
        },
      });
    }
  } catch (err) {
    functions.logger.error("Something Went Wrong.", err);
    res.status(400).json({
      result: {
        success: false,
        message: "ERROR: Creating Twitter User.",
      },
    });
  }
});

server.get("/link", getUserCredentials, async (req: any, res: any) => {
  try {
    if (!req["jwt"]) {
      functions.logger.error("UNAUTHENTICATED Request.");
      res.status(401).json(
          {
            result: {
              success: false,
              message: "Unauthenticated",
              status: "UNAUTHENTICATED",
            },
          }
      );
    } else {
      if (req.query.code) {
        const code = req.query.code.toString().trim();
        const secrets: any = await exportSecret();

        const TWITTER_AUTH_TOKEN_URL: string = secrets.TWITTER_AUTH.TOKEN_URL; // https://api.twitter.com/2/oauth2/token

        const data = qs.stringify({
          code: code,
          grant_type: "authorization_code",
          client_id: `${secrets.TWITTER_AUTH.CLIENT_ID}`,
          redirect_uri: `${secrets.TWITTER_AUTH.REDIRECT_URI}`,
          code_verifier: "challenge",
        });

        try {
          const authorize = await fetch(
              TWITTER_AUTH_TOKEN_URL,
              {
                method: "POST",
                body: data,
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
              }
          );
          const authResponse = await authorize.json();
          if (authResponse.access_token && authResponse.refresh_token) {
            const accessToken: string = authResponse.access_token;
            const refreshToken: string = authResponse.refresh_token;

            const TWITTER_AUTH_USER_URL: string = secrets.TWITTER_AUTH.USER_URL; // https://api.twitter.com/2/users/me
            const userResponse = await getAuthUserDetails(TWITTER_AUTH_USER_URL, accessToken);
            if (!userResponse?.success) {
              res.status(400).json({
                result: {
                  success: userResponse?.success,
                  message: userResponse?.message,
                },
              });
            } else {
              const id: any = userResponse?.twitter?.id;
              const username: any = userResponse?.twitter?.username;
              const name: any = userResponse?.twitter?.name;
              const profileImg: any = userResponse?.twitter?.profileImg;
              const userId: string = req["jwt"]["uid"];

              // Link user.
              const linkUser = await linkTwitterFirebaseAccount(
                  id,
                  userId,
                  username,
                  name,
                  profileImg
              );
              if (!linkUser.success) {
                res.status(400).json({
                  result: {
                    success: linkUser.success,
                    message: linkUser.message,
                  },
                });
              } else {
                // Add custom claims
                const addClaims = await attachTwitterClaims(id, name, userId, username);
                if (!addClaims.success) {
                  res.status(400).json({
                    result: {
                      success: addClaims.success,
                      message: addClaims.message,
                    },
                  });
                } else {
                  // Store Token.
                  const storeToken = await storeTwitterTokens(id, accessToken, refreshToken);
                  if (!storeToken.success) {
                    res.status(400).json({
                      result: {
                        success: storeToken.success,
                        message: storeToken.message,
                      },
                    });
                  } else {
                    res.status(200).json(
                        {
                          result: {
                            success: true,
                            message: "Success",
                          },
                        }
                    );
                  }
                }
              }
            }
          } else {
            res.status(400).json({
              result: {
                success: false,
                message: "ERROR: Invalid Response from Twitter Auth.",
              },
            });
          }
        } catch (err) {
          functions.logger.error("Invalid Response from Twitter Auth", err);
          res.status(400).json({
            result: {
              success: false,
              message: "ERROR: Invalid Response from Twitter Auth.",
            },
          });
        }
      } else {
        res.status(400).json({
          result: {
            success: false,
            message: "Query Parameter `code` missing.",
          },
        });
      }
    }
  } catch (err) {
    functions.logger.error("Something Went Wrong.", err);
    res.status(400).json({
      success: false,
      message: "ERROR: Linking Twitter User.",
    });
  }
});

async function getAuthUserDetails(
    url: string,
    bearerToken: string,
) {
  try {
    const user = await fetch(
        url,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${bearerToken}`,
          },
        }
    );
    const userResponse = await user.json();
    if (userResponse.data?.id && userResponse.data?.username) {
      const id: string = userResponse.data?.id;
      const username: string = userResponse.data?.username;
      const name: string = userResponse.data?.name;
      const profileImg: string = userResponse.data?.profile_image_url;

      return {
        success: true,
        message: "Success",
        error: "Success",
        twitter: {
          id,
          username,
          name,
          profileImg,
        },
      };
    }
    return {
      success: false,
      message: "ERROR: Twitter Credentials NOT Found.",
      error: `Twitter Credentials Retrieve Error. Response: ${userResponse}`,
    };
  } catch (err) {
    functions.logger.error("Invalid Response from Twitter User", err);
    return {
      success: false,
      message: "ERROR: Twitter Credentials NOT Found.",
      error: `Twitter Credentials Retrieve Error. Error: ${err}`,
    };
  }
}

async function linkTwitterFirebaseAccount(
    id: string,
    userId: string,
    username: string,
    name: string,
    profileImg: string
) {
  try {
    const user = await db.collection("xusers").doc(`${userId}`).get();
    if (!user.exists) {
      return {
        success: false,
        message: "Invalid User.",
        error: `User NOT Found for id: ${userId}`,
      };
    }

    // Check if user has twitter.
    const userData: any = user.data();
    if (userData["socials"]["twitter_id"] !== "") {
      return {
        success: false,
        message: "Twitter Already linked.",
        error: `Twitter Already linked for id: ${userId}`,
      };
    }

    // Check if twitter id is already linked.
    const isLinked = await db.collection("xusers").where("socials.twitter_id", "==", `${id}`).get();
    if (isLinked.size !== 0) {
      const uid: string = isLinked.docs[0].id;
      return {
        success: false,
        message: "Twitter Already linked to different user.",
        error: `Twitter Already linked for id: ${userId} to ${uid}`,
      };
    }

    // Update user profile.
    const updateUser = await db.collection("xusers").doc(`${userId}`).update(
        {
          "socials.twitter_id": id,
          "socials.twitter_username": username,
        }
    );
    if (updateUser) {
      // Update Provider Data.
      await auth.updateUser(
          userId,
          {
            photoURL: profileImg,
          }
      );

      return {
        success: true,
        message: "Success",
        error: "Success",
      };
    }
    return {
      success: false,
      message: "Twitter linking failed.",
      error: `Twitter details updated failed for id: ${userId}`,
    };
  } catch (err) {
    functions.logger.error("Something Went Wrong.", err);
    return {
      success: false,
      message: "ERROR: Linking Twitter User.",
      error: `Linking Twitter - User Search Failed. - ${err}`,
    };
  }
}

async function createTwitterFirebaseAccount(
    id: string,
    name: string,
    username: string,
    profileImg: string,
) {
  try {
    const getUserId = await createUserId(id);
    if (!getUserId.success) {
      return {
        success: getUserId.success,
        message: getUserId.message,
        error: getUserId.error,
      };
    }

    // Valid User found.
    const userId: any = getUserId?.uid;
    if (getUserId?.isNew) {
      await auth.createUser(
          {
            uid: userId,
            displayName: name,
            photoURL: profileImg,
          }
      );
    }
    return {
      success: true,
      message: "Success",
      error: "Success",
      userId: userId,
      isNew: getUserId?.isNew,
    };
  } catch (err) {
    functions.logger.error("Creating Twitter user Failed", err);
    return {
      success: false,
      message: "ERROR: Creating Twitter User.",
      error: `Creating Twitter user Failed - Error: ${err}`,
    };
  }
}

async function attachTwitterClaims(
    id: string,
    name: string,
    userId: string,
    username: string
) {
  try {
    const claims: any = {
      twitter: {
        id: id,
        username: username,
        name: name,
      },
    };
    await auth.setCustomUserClaims(
        userId,
        claims
    );
    return {
      success: true,
      message: "Success",
      error: "Success",
      claims,
    };
  } catch (err) {
    functions.logger.error("Setting Custom Claim Failed", err);
    return {
      success: false,
      message: "ERROR: Twitter registration for app failed!",
      error: `Setting Custom Claim Failed - Error: ${err}`,
    };
  }
}

async function createCustomToken(
    uid: string,
) {
  try {
    const token = await auth.createCustomToken(uid);
    return {
      success: true,
      message: "Success",
      error: "Success",
      token: token,
    };
  } catch (err) {
    functions.logger.error("Generating Custom Token Failed", err);
    return {
      success: false,
      message: "ERROR: Twitter registration for app failed!",
      error: `Generating Custom Token Failed - Error: ${err}`,
    };
  }
}

async function storeTwitterTokens(
    id: string,
    accessToken: string,
    refreshToken: string
) {
  try {
    await db.collection("xtwitter-tokens").doc(`${id}`).set(
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
        }
    );
    return {
      success: true,
      message: "Success",
      error: "Success",
    };
  } catch (err) {
    functions.logger.error("Storing Twitter Token Failed", err);
    return {
      success: false,
      message: "ERROR: Twitter registration for app failed!",
      error: `Storing Twitter Token Failed - Error: ${err}`,
    };
  }
}

async function createUserId(
    id: string
) {
  // Check if this twitter id is already linked.
  const users = await db.collection("xusers").where("socials.twitter_id", "==", `${id}`).get();
  if (users.size === 0) {
    const uid: string = (await import("crypto")).createHash("md5").update(id).digest("hex");
    // Check if this user id exists.
    try {
      await auth.getUser(uid);
      return {
        success: true,
        message: "Success",
        error: "Success",
        uid: uid,
        isNew: false,
      };
    } catch (err) {
      return {
        success: true,
        message: "Success",
        error: "Success",
        uid: uid,
        isNew: true,
      };
    }
  } else if (users.size === 1) {
    const uid: string = users.docs[0].id;
    return {
      success: true,
      message: "Success",
      error: "Success",
      uid: uid,
      isNew: false,
    };
  }
  return {
    success: false,
    message: "Twitter Id already linked.",
    error: `Twitter ID Already linked. No.of users found ${users.size}`,
  };
}
