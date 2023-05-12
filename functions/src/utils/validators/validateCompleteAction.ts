/* eslint-disable max-len */
import {db} from "../init/init";
import {ethers} from "ethers";

export async function validateCompleteActionRequest(
    token: any,
    data: any
) {
  const questActionOrderId: string = data?.action_order_id;
  // 1. Validate Token Object
  const isValidToken = validateTokenObject(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  // 2. Validate if user is authorized.
  const userId: string = questActionOrderId.trim().split("|")[1].split("-")[0];
  const isAuthorizedUser = validateIfAuthorizedUser(token?.uid, userId);
  if (!isAuthorizedUser.success) {
    return {
      success: isAuthorizedUser.success,
      error: isAuthorizedUser.error,
      message: isAuthorizedUser.message,
    };
  }

  // Retrieve Docs.
  const docs = await retrieveDocs(userId, questActionOrderId);
  if (!docs.success) {
    return {
      success: docs.success,
      error: docs.error,
      message: docs.message,
    };
  }

  // Validate User.
  const user: any = docs.retrievedDocs[`${userId}`];
  const validUser = validateUser(user);
  if (!validUser.success) {
    return {
      success: validUser.success,
      error: validUser.error,
      message: validUser.message,
    };
  }

  // 4. Validate if Quest is Valid.
  const quest: any = docs.retrievedDocs[`${docs.questId}`];
  const validQuest = await validateQuest(quest);
  if (!validQuest.success) {
    return {
      success: validQuest.success,
      error: validQuest.error,
      message: validQuest.message,
    };
  }

  // 5. Validate if Action Order is Valid.
  const questActionOrder: any = docs.retrievedDocs[`${questActionOrderId}`];
  const validQuestActionOrder = await validateQuestActionOrder(questActionOrder);
  if (!validQuestActionOrder.success) {
    return {
      success: validQuestActionOrder.success,
      error: validQuestActionOrder.error,
      message: validQuestActionOrder.message,
    };
  }

  // 6. Validate if Action is Valid.
  const action: any = docs.retrievedDocs[`${docs.actionId}`];
  const validAction = await validateAction(user.data, token, action, data);
  if (!validAction.success) {
    return {
      success: validAction.success,
      error: validAction.error,
      message: validAction.message,
    };
  }

  // 7. Validate if Quest Order is Valid.
  const questOrder: any = docs.retrievedDocs[`${docs.questOrderId}`];
  const validQuestOrder = await validateQuestOrder(questOrder);
  if (!validQuestOrder.success) {
    return {
      success: validQuestOrder.success,
      error: validQuestOrder.error,
      message: validQuestOrder.message,
    };
  }

  // Check if Previous Action (if Exists is complete)
  if (docs.prevQuestActionOrderId !== "") {
    const questPrevActionOrder: any = docs.retrievedDocs[`${docs.prevQuestActionOrderId}`];
    const validPrevQuestActionOrder = await validatePrevQuestActionOrder(questPrevActionOrder);
    if (!validPrevQuestActionOrder.success) {
      return {
        success: validPrevQuestActionOrder.success,
        error: validPrevQuestActionOrder.error,
        message: validPrevQuestActionOrder.message,
      };
    }
  }

  return {
    success: true,
    message: "NONE",
    error: "NONE",
    orgId: docs.orgId,
    questId: docs.questId,
    questOrderId: docs.questOrderId,
    actionId: docs.actionId,
    user: user.data,
    quest: quest.data,
    questOrder: questOrder.data,
    questActionOrder: questActionOrder.data,
    action: action.data,
    streak: validQuestActionOrder.streak,
  };
}

async function validatePrevQuestActionOrder(
    prevQuestActionOrder: any
) {
  if (!prevQuestActionOrder.exists) {
    return {
      success: false,
      error: "Previous Action Doesn't Exist.",
      message: "Invalid Action Order Id.",
    };
  }
  // Validate Status
  if (prevQuestActionOrder?.data?.action_order_status !== (await import("../enums/orderStatus")).OrderStatus.COMPLETED) {
    return {
      success: false,
      message: "ERROR: Please complete previous task!",
      error: "User hasn't completed Previous Task.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function validateTokenObject(
    token: any
) {
  if (!token?.uid) {
    return {success: false, message: "ERROR: Invalid Token", error: `Invalid Token. \nToken Details: ${token}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

function validateIfAuthorizedUser(
    tokenUserId: string,
    questUserId: string,
) {
  if (questUserId !== tokenUserId) {
    return {success: false, message: "ERROR: Invalid Request", error: `Trying to complete different Users quest. ${tokenUserId} for ${questUserId}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function retrieveDocs(
    userId: string,
    questActionOrderId: string,
) {
  const orgId: string = questActionOrderId.trim().split("_")[0];
  const questId: string = questActionOrderId.trim().split("|")[0];
  const questOrderId: string = questActionOrderId.trim().split("-")[0];
  const actionId = Number(questActionOrderId.trim().split("-")[1]);

  const docsRetrieval: any[] = [];
  const retrievedDocs : any = {};
  let prevQuestActionOrderId = "";

  try {
    // 1. Quest Order.
    const questOrder = db.collection("xquest_order").doc(`${questOrderId}`);
    docsRetrieval.push(questOrder);
    // 2. Quest Action Order.
    const questActionOrder = questOrder.collection("action_order").doc(`${questActionOrderId}`);
    docsRetrieval.push(questActionOrder);
    // 3. Quest Details.
    const quest = db.collection("xorgs").doc(`${orgId}`).collection("quests").doc(`${questId}`);
    docsRetrieval.push(quest);
    // 4. Action Details.
    const questAction = quest.collection("actions").doc(`${actionId}`);
    docsRetrieval.push(questAction);
    // 5. User Details.
    const user = db.collection("xusers").doc(`${userId}`);
    docsRetrieval.push(user);

    // 6. Prev Action Details
    if (actionId !== 1) {
      const questPrevActionOrderId: string = questOrderId + "-" + (actionId - 1).toString();
      const prevActionOrder = questOrder.collection("action_order").doc(`${questPrevActionOrderId}`);
      docsRetrieval.push(prevActionOrder);
      prevQuestActionOrderId = questPrevActionOrderId;
    }
  } catch (err) {
    return {success: false, error: `Document Retrieval Object Failed!. ${err}`, message: "Document Retrieval Object Failed!"};
  }

  try {
    const docs = await db.getAll(...docsRetrieval);
    for (let i = 0; i < docs.length; i++) {
      retrievedDocs[docs[i].id] = {
        id: docs[i].id,
        exists: docs[i].exists,
        data: docs[i].data(),
      };
    }
  } catch (err) {
    return {success: false, error: `Document Retrieval Failed!. ${err}`, message: "Document Retrieval Failed!"};
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    orgId,
    questId,
    questOrderId,
    prevQuestActionOrderId,
    actionId,
    retrievedDocs,
  };
}

async function validateQuest(
    questDoc: any
) {
  if (!questDoc.exists) {
    return {
      success: false,
      error: "Quest Doesn't Exist.",
      message: "Invalid QuestId",
    };
  }
  // Validate Quest Type.
  const validQuest = await validateQuestType(questDoc.data);
  if (!validQuest.success) {
    return validQuest;
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function validateUser(
    userDoc: any
) {
  if (!userDoc.exists) {
    return {
      success: false,
      error: "User Doesn't Exist.",
      message: "Invalid UserId",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestType(
    questData: any
) {
  if (questData.quest_type === (await import("../enums/questType")).QuestType.Special) {
    return validateQuestTypeSpecial(questData);
  } else if (questData.quest_type === (await import("../enums/questType")).QuestType.DailyReward) {
    return validateQuestTypeDaily(questData);
  } else {
    return validateQuestTypeNormal(questData);
  }
}

function validateQuestTypeSpecial(
    questData: any
) {
  const _currentTime = Math.ceil(new Date().getTime() / 1000);
  if (questData.start_date > _currentTime) {
    return {success: false, message: "ERROR: Quest NOT started yet.", error: "Quest NOT yet started."};
  } else if (questData.expiry < _currentTime) {
    return {success: false, message: "ERROR: Quest has ENDED.", error: "Quest has Ended."};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

function validateQuestTypeNormal(
    questData: any
) {
  return {success: true, message: "NONE", error: "NONE"};
}

function validateQuestTypeDaily(
    questData: any
) {
  return {success: true, message: "NONE", error: "NONE"};
}

async function validateAction(
    user: any,
    token: any,
    actionDoc: any,
    inputData: any
) {
  if (!actionDoc.exists) {
    return {
      success: false,
      error: "Action Doesn't Exist.",
      message: "Invalid Action",
    };
  }

  const isValid = await validateActionType(user, token, actionDoc.data, inputData);
  if (!isValid.success) {
    return {
      success: isValid.success,
      error: isValid.error,
      message: isValid.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestOrder(
    questOrderDoc: any
) {
  if (!questOrderDoc.exists) {
    return {
      success: false,
      error: "QuestOrder Doesn't Exist.",
      message: "Invalid QuestOrderId",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestActionOrder(
    questActionOrderDoc: any
) {
  if (!questActionOrderDoc.exists) {
    return {
      success: false,
      error: "QuestOrder Doesn't Exist.",
      message: "Invalid QuestOrderId",
    };
  }

  // Validate Action Call Time.
  const isValidCall = await validateQuestActionCoolOff(questActionOrderDoc.data);
  if (!isValidCall.success) {
    return {
      success: isValidCall.success,
      error: isValidCall.error,
      message: isValidCall.message,
    };
  }

  // Validate Action Status.
  const isValidStatus = await validateQuestActionOrderStatus(questActionOrderDoc.data);
  if (!isValidStatus.success) {
    return {
      success: isValidStatus.success,
      error: isValidStatus.error,
      message: isValidStatus.message,
    };
  }

  const isValidType = await validateActionOrderType(questActionOrderDoc.data);
  if (!isValidType.success) {
    return {
      success: isValidType.success,
      error: isValidType.error,
      message: isValidType.message,
    };
  }

  return {
    success: true,
    error: "NONE",
    message: "NONE",
    streak:
            isValidType?.streak ?
            isValidType.streak :
            0,
  };
}

async function validateQuestActionOrderStatus(
    questActionOrder: any
) {
  if (questActionOrder?.action_order_status !== (await import("../enums/orderStatus")).OrderStatus.PENDING) {
    return {
      success: false,
      message: "ERROR: You have completed the Action!",
      error: "User already completed the action.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateQuestActionCoolOff(
    questActionOrder: any
) {
  if (
    questActionOrder.action_order_type === (await import("../enums/actionType")).ActionType.SocialTwitterVerify ||
    questActionOrder.action_order_type === (await import("../enums/actionType")).ActionType.VerifyOnChain
  ) {
    if (questActionOrder?.action_last_call) {
      const currentTime = Math.ceil(new Date().getTime() / 1000);
      const actionLastCall = Number(questActionOrder?.action_last_call);

      if (currentTime - actionLastCall < 60) {
        return {
          success: false,
          message: "ERROR: You need to wait 60 seconds before you retry!",
          error: `User tried to complete Action multiple times in a minute. CurrentTime: ${currentTime} LastActionTime: ${actionLastCall}`,
        };
      }
    }
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionOrderType(
    actionOrder: any
) {
  if (actionOrder.action_order_type === (await import("../enums/actionType")).ActionType.DailyReward) {
    // `answer` field.
    const isValid = validateActionTypeDailyReward(actionOrder);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
        streak: isValid.streak,
      };
    }

    return {
      success: true,
      message: "NONE",
      error: "NONE",
      streak: isValid.streak,
    };
  }
  return {
    success: true,
    message: "NONE",
    error: "NONE",
  };
}

async function validateActionType(
    user: any,
    token: any,
    action: any,
    inputData: any
) {
  console.log("Action Type", action.type);
  if (action.type === (await import("../enums/actionType")).ActionType.Quiz) {
    // `answer` field.
    const isValid = validateActionTypeQuiz(action, inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.FeedbackForm) {
    // `answers` & `comment` field.
    const isValid = validateActionTypeFeedbackForm(action, inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.Notify) {
    // `email` field.
    const isValid = await validateActionTypeNotify(inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.SocialTwitter || action.type === (await import("../enums/actionType")).ActionType.SocialTwitterVerify) {
    // `tweet_url` field & userFields.
    const isValid = await validateActionTypeTwitter(user, action, inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.SocialDiscord) {
    // `doc_link` field.
    const isValid = await validateActionTypeDiscord(user, token, action);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.SubmitForReview) {
    // `doc_link` field.
    const isValid = await validateActionTypeSubmitForReview(inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.FullName) {
    // `name` field.
    const isValid = validateActionTypeFullName(inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.ProfileImage) {
    // `image_url` field.
    const isValid = await validateActionTypeProfileImage(inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.LinkDiscord) {
    // `token` field.
    const isValid = await validateActionTypeLinkDiscord(user, token);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.LinkTwitter) {
    // `token` field.
    const isValid = await validateActionTypeLinkTwitter(user, token);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.HarborAirdrop) {
    // `token` field.
    const isValid = await validateActionTypeHarborAirdrop(user, inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.ConnectCapxWallet) {
    // `token` field.
    const isValid = await validateActionTypeConnectCapxWallet(user, inputData);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  } else if (action.type === (await import("../enums/actionType")).ActionType.VerifyOnChain) {
    // `token` field.
    const isValid = await validateActionTypeVerifyOnChain(user, action);
    if (!isValid.success) {
      return {
        success: isValid.success,
        error: isValid.error,
        message: isValid.message,
      };
    }
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function validateActionTypeQuiz(
    action: any,
    inputData: any,
) {
  if (!inputData?.answer) {
    return {
      success: false,
      message: "ERROR: Missing `answer` parameter!",
      error: "Missing `answer` parameter!",
    };
  }

  if (inputData?.answer.trim() !== action?.answer) {
    return {
      success: false,
      message: "ERROR: Wrong answer!",
      error: "User provided Wrong answer.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function validateActionTypeFeedbackForm(
    action: any,
    inputData: any
) {
  if (!inputData?.answers) {
    return {
      success: false,
      message: "ERROR: Missing `answers` parameter!",
      error: "Missing `answers` parameter!",
    };
  }
  if (!inputData?.comment) {
    return {
      success: false,
      message: "ERROR: Missing `comment` parameter!",
      error: "Missing `comment` parameter!",
    };
  }

  if (inputData?.answers.length !== (Number(action?.options.length) - 1)) {
    return {
      success: false,
      message: "ERROR: Invalid Input for `answers` parameter!",
      error: "Invalid Input for `answers` parameter!",
    };
  }

  if (inputData?.comment.trim().length < 0) {
    return {
      success: false,
      message: "ERROR: Invalid Input for `comment` parameter!",
      error: "Invalid Input for `comment` parameter!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeNotify(
    inputData: any
) {
  if (!inputData?.email) {
    return {
      success: false,
      message: "ERROR: Missing `email` parameter!",
      error: "Missing `email` parameter!",
    };
  }

  if (!(await import("../verifiers/inputVerifier")).emailVerifierRegex(inputData?.email.trim())) {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `email`!",
      error: "User provided invalid value for parameter `email`",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeSubmitForReview(
    inputData: any
) {
  if (!inputData?.doc_link) {
    return {
      success: false,
      message: "ERROR: Missing `doc_link` parameter!",
      error: "Missing `doc_link` parameter!",
    };
  }

  if (!(await import("../verifiers/inputVerifier")).docLinkVerifier(inputData?.doc_link.trim())) {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `doc_link`!",
      error: "User provided invalid value for parameter `doc_link`",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

function validateActionTypeFullName(
    inputData: any
) {
  if (!inputData?.name) {
    return {
      success: false,
      message: "ERROR: Missing `name` parameter!",
      error: "Missing `name` parameter!",
    };
  }

  if (inputData?.name.trim() === "") {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `name`!",
      error: "User provided invalid value for parameter `name`",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeProfileImage(
    inputData: any
) {
  if (!inputData?.image_url) {
    return {
      success: false,
      message: "ERROR: Missing `image_url` parameter!",
      error: "Missing `image_url` parameter!",
    };
  }

  if (!(await import("../verifiers/inputVerifier")).imageUrlVerifier(inputData?.image_url.trim())) {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `image_url`!",
      error: "User provided invalid value for parameter `image_url`",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeLinkTwitter(
    user: any,
    token: any
) {
  if (user?.socials["twitter_id"] !== "") {
    return {
      success: true,
      message: "ERROR: Twitter already linked.",
      error: "Twitter already linked.",
    };
  }

  if (!token?.firebase?.identities["twitter.com"]) {
    return {
      success: false,
      message: "ERROR: Token Missing `twitter` credentials!",
      error: "Token Missing `twitter` credentials!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeHarborAirdrop(
    user: any,
    inputData: any,
) {
  if (user?.wallets?.cosmos?.comdex && user?.wallets?.cosmos?.comdex !== "") {
    return {
      success: true,
      message: "Wallet Already Connected.",
      error: `User already has wallet ${user?.wallet?.cosmos?.comdex}`,
    };
  }

  if (!inputData?.comdex_address) {
    return {
      success: false,
      message: "ERROR: Missing `comdex_address` parameter!",
      error: "Missing `comdex_address` parameter!",
    };
  }

  if (!(await import("../verifiers/inputVerifier")).comdexAddressVerifier(inputData?.comdex_address.trim())) {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `comdex_address`!",
      error: "User provided invalid value for parameter `comdex_address`",
    };
  }

  const isValid = await checkIfAddressExists("wallets.cosmos.comdex", inputData?.comdex_address.trim());
  if (!isValid.success) {
    return {
      success: isValid.success,
      error: isValid.error,
      message: isValid.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeConnectCapxWallet(
    user: any,
    inputData: any,
) {
  if (user?.wallets?.evm && user?.wallets?.evm !== "") {
    return {
      success: true,
      message: "Wallet Already Connected.",
      error: `User already has wallet ${user?.wallets?.evm}`,
    };
  }

  if (!inputData?.wallet_address) {
    return {
      success: false,
      message: "ERROR: Missing `wallet_address` parameter!",
      error: "Missing `wallet_address` parameter!",
    };
  }

  if (!(await import("../verifiers/inputVerifier")).evmAddressVerifier(inputData?.wallet_address.trim())) {
    return {
      success: false,
      message: "ERROR: Invalid value for parameter `wallet_address`!",
      error: "User provided invalid value for parameter `wallet_address`",
    };
  }

  const checkSumAddress = ethers.utils.getAddress(inputData?.wallet_address.trim());
  const isValid = await checkIfAddressExists("wallets.evm", checkSumAddress);
  if (!isValid.success) {
    return {
      success: isValid.success,
      error: isValid.error,
      message: isValid.message,
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function checkIfAddressExists(
    checkPath: string,
    walletAddress: string,
) {
  const docs = await db.collection("xusers").where(`${checkPath}`, "==", walletAddress).get();
  if (docs.size != 0) {
    return {
      success: false,
      message: "ERROR: Wallet already connected!",
      error: "User provided `address` is already connected.",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeLinkDiscord(
    user: any,
    token: any
) {
  if (user?.socials["discord_id"] !== "") {
    return {
      success: true,
      message: "ERROR: Discord already linked.",
      error: "Discord already linked.",
    };
  }

  if (!token?.discord?.id) {
    return {
      success: false,
      message: "ERROR: Missing `discord-id` claim!",
      error: "Missing `discord-id` claim!",
    };
  }

  if (!token?.discord?.username) {
    return {
      success: false,
      message: "ERROR: Missing `discord-username` claim!",
      error: "Missing `discord-username` claim!",
    };
  }

  if (!token?.discord?.discriminator) {
    return {
      success: false,
      message: "ERROR: Missing `discord-discriminator` claim!",
      error: "Missing `discord-discriminator` claim!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeTwitter(
    user: any,
    action: any,
    inputData: any
) {
  if (user?.socials?.twitter_id === "") {
    return {
      success: false,
      message: "ERROR: Twitter Not linked!",
      error: "User Twitter Not linked!",
    };
  }

  const isValid = await validateActionTypeTwitterVerificationEngine(action, inputData);
  if (!isValid.success) {
    return isValid;
  }

  const tweetURL = isValid?.tweetURL;
  const twitterId = user?.socials?.twitter_id;

  const verifyAction = await (await import("../actions/verifyTwitterActions")).verifyTwitterActions(action, twitterId, tweetURL);
  if (!verifyAction) {
    return {
      success: false,
      message: "ERROR: Task verification failed!",
      error: "Task verification failed!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeDiscord(
    user: any,
    token: any,
    action: any,
) {
  if (user?.socials?.discord_username === "") {
    return {
      success: false,
      message: "ERROR: Discord Not linked!",
      error: "User Discord Not linked!",
    };
  }

  const verifyAction = await (await import("../actions/verifyDiscordActions")).verifyDiscordActions(token, action, user?.socials?.discord_username.tirm());
  if (!verifyAction) {
    return {
      success: false,
      message: "ERROR: Task verification failed!",
      error: "Task verification failed!",
    };
  }

  return {success: true, error: "NONE", message: "NONE"};
}

async function validateActionTypeTwitterVerificationEngine(
    action: any,
    inputData: any
) {
  let tweetURL = "";
  if (action.verification_engine === (await import("../enums/twitterActionType")).TwitterActionType.UserTweet) {
    if (!inputData?.tweet_url) {
      return {
        success: false,
        message: "ERROR: Missing `tweet_url` parameter!",
        error: "Missing `tweet_url` parameter!",
        tweetURL: tweetURL,
      };
    }

    if (!(await import("../verifiers/inputVerifier")).tweetUrlVerifier(inputData?.tweet_url.trim())) {
      return {
        success: false,
        message: "ERROR: Invalid value for parameter `tweet_url`!",
        error: "User provided invalid value for parameter `tweet_url`",
        tweetURL: tweetURL,
      };
    }

    tweetURL = inputData?.tweet_url.trim();
  }
  return {
    success: true,
    message: "NONE",
    error: "NONE",
    tweetURL: tweetURL,
  };
}

function validateActionTypeDailyReward(
    actionOrder: any
) {
  let streak = 0;
  if (actionOrder.last_claimed_at !== Number(0)) {
    const lastRewardClaimedAt = Number(actionOrder.last_claimed_at); // This is normalised to the 00:00 of the corresponding day.
    const currentTime = Math.floor(Math.ceil(new Date().getTime() / 1000) / 86400) * 86400;
    streak = Number(actionOrder.streak);
    if (currentTime - lastRewardClaimedAt < 86400) {
      return {
        success: false,
        message: "ERROR: Cannot claim twice in a single day",
        error: "User trying to claim multiple times in a single day.",
        streak,
      };
    }
    if (currentTime - lastRewardClaimedAt === 86400) {
      streak += 1;
    }
    if (currentTime - lastRewardClaimedAt > 86400) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  return {
    success: true,
    message: "NONE",
    error: "NONE",
    streak,
  };
}

async function validateActionTypeVerifyOnChain(
    user: any,
    action: any,
) {
  const isWalletConnected = await validateUserWallet(
      user,
      action.verification_engine
  );
  if (!isWalletConnected.success) {
    return {
      success: isWalletConnected.success,
      error: isWalletConnected.error,
      message: isWalletConnected.message,
    };
  }

  const walletAddress: any = isWalletConnected.walletAddress;
  // Validate Action Type.
  if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.VoteHarbor) {
    const result = await (await import("../verifiers/on-chain/comdex/checkHarborProposalVotes")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.MintCMSTVault) {
    const result = await (await import("../verifiers/on-chain/comdex/checkCMSTMintByVault")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.MintCMSTStablemint) {
    const result = await (await import("../verifiers/on-chain/comdex/checkCMSTMintByStableMint")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.StakeHarbor) {
    const result = await (await import("../verifiers/on-chain/comdex/checkStakeOnHarbor")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LendCMST) {
    const result = await (await import("../verifiers/on-chain/comdex/checkLendCMSTOnCommodo")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.BorrowWithCMST) {
    const result = await (await import("../verifiers/on-chain/comdex/checkBorrowWithCMSTCommodo")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.TradeCSwap) {
    const result = await (await import("../verifiers/on-chain/comdex/checkTradeOnCSwap")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LiquidityFarmMaster) {
    const result = await (await import("../verifiers/on-chain/comdex/checkMasterPoolLiquidity")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  } else if (action.verification_engine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LiquidityFarmChild) {
    const result = await (await import("../verifiers/on-chain/comdex/checkChildPoolLiquidity")).getResult(walletAddress, action);
    if (!result.success) {
      return {
        success: result.success,
        error: result.error,
        message: result.message,
      };
    }
  }
  return {success: true, error: "NONE", message: "NONE", walletAddress};
}

async function validateUserWallet(
    user: any,
    verificationEngine: string
) {
  let walletAddress = "";
  if (
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.VoteHarbor ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.MintCMSTVault ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.MintCMSTStablemint ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.StakeHarbor ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LendCMST ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.BorrowWithCMST ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.TradeCSwap ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LiquidityFarmMaster ||
    verificationEngine === (await import("../enums/onChainVerifyType")).OnChainVerifyType.LiquidityFarmChild
  ) {
    // Verify if comdex wallet present.
    if (!(user?.wallets?.cosmos?.comdex && user?.wallets?.cosmos?.comdex !== "")) {
      return {
        success: false,
        message: "ERROR: Comdex Wallet Not linked!",
        error: "Comdex Wallet Not linked!",
      };
    }

    walletAddress = user?.wallets?.cosmos?.comdex;
  }

  return {success: true, error: "NONE", message: "NONE", walletAddress};
}
