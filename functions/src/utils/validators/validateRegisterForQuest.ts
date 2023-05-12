/* eslint-disable max-len */
import {db} from "../init/init";


export async function validateRegisterForQuest(
    token:any,
    data: any
) {
  // Validate Token Object.
  const isValidToken = validateTokenObject(token);
  if (!isValidToken.success) {
    return {
      success: isValidToken.success,
      error: isValidToken.error,
      message: isValidToken.message,
    };
  }

  const docs = await retrieveDocs(token?.uid, data?.questId);
  if (!docs.success) {
    return {
      success: docs.success,
      error: docs.error,
      message: docs.message,
    };
  }

  // 1. Validate Quest.
  const quest: any = docs.retrievedDocs["xorgs"];
  const validQuest = await validateQuest(quest);
  if (!validQuest.success) {
    return {
      success: validQuest.success,
      error: validQuest.error,
      message: validQuest.message,
    };
  }

  // 2. Validate User.
  const user: any = docs.retrievedDocs["xusers"];
  const validUser = validateUser(user, quest.data);
  if (!validUser.success) {
    return {
      success: validUser.success,
      error: validUser.error,
      message: validUser.message,
    };
  }

  // 3. Validate Quest-Order.
  const questOrder: any = docs.retrievedDocs["xquest_order"];
  const validQuestOrder = validateQuestOrder(questOrder);
  if (!validQuestOrder.success) {
    return {
      success: validQuestOrder.success,
      error: validQuestOrder.error,
      message: validQuestOrder.message,
      quest_order_id: validQuestOrder.quest_order_id,
      quest_status: validQuestOrder.quest_status,
    };
  }

  return {
    success: true,
    message: "NONE",
    error: "NONE",
    orgId: docs.orgId,
    questOrderId: docs.questOrderId,
    quest: quest.data,
    user: user.data,
  };
}

function validateTokenObject(
    token: any
) {
  if (!token?.uid) {
    return {success: false, message: "ERROR: Invalid Token", error: `Invalid Token. \nToken Details: ${token}`};
  }
  return {success: true, message: "NONE", error: "NONE"};
}

async function retrieveDocs(
    userId: string,
    questId: string
) {
  // 1. User Doc.
  const _user = db.collection("xusers").doc(userId);
  // 2. Quest Doc.
  const orgId = questId.split("_")[0];
  const _quest = db.collection("xorgs").doc(orgId).collection("quests").doc(questId);
  // 3. Quest-Order Doc.
  const questOrderId = questId + "|" + userId;
  const _questOrder = db.collection("xquest_order").doc(`${questOrderId}`);

  const _retrievedDocs : any = {};
  try {
    const docs = await db.getAll(_user, _quest, _questOrder);
    for (let i = 0; i < docs.length; i++) {
      _retrievedDocs[docs[i].ref.path.split("/")[0]] = {
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
    retrievedDocs: _retrievedDocs,
    orgId: orgId,
    questOrderId: questOrderId,
  };
}

async function validateQuest(
    questDoc: any
) {
  if (!questDoc.exists) {
    return {
      success: false,
      error: "Quest Doesn't Exist.",
      message: "Invalid QuestID",
    };
  }

  // Validate Quest Type.
  const validQuest = await validateQuestType(questDoc.data);
  if (!validQuest.success) {
    return validQuest;
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

function validateUser(
    user: any,
    quest: any
) {
  if (!user.exists) {
    return {success: false, message: "ERROR: User doesn't exist!", error: "User doesn't exist."};
  }

  const isAllowed = checkIfUserAllowed(user.data, quest.allowed_users);
  if (!isAllowed.success) {
    return isAllowed;
  }

  const isValidToRegister = checkIfUserRegistrationValid(user.data, quest.quest_day);
  if (!isValidToRegister.success) {
    return isValidToRegister;
  }

  return {success: true, message: "NONE", error: "NONE"};
}

function checkIfUserAllowed(
    userData: any,
    whitelistedUsers: string[]
) {
  if (whitelistedUsers.length > 0) {
    if (!whitelistedUsers.includes(userData?.username)) {
      return {success: false, message: "ERROR: User NOT authorized.", error: "User is NOT Authorized to register."};
    }
  }
  return {success: true, message: "NONE", error: "NONE"};
}

function checkIfUserRegistrationValid(
    userData: any,
    questDay: string
) {
  const _currentTime = Math.ceil(new Date().getTime() / 1000);
  const _userRegistrationTime = userData.registered_on;
  const _requiredDiff = (Number(questDay.split("DAY")[1])-1) * 86400;

  const _timeDiff = _currentTime - _userRegistrationTime;
  if (_requiredDiff > _timeDiff) {
    return {success: false, message: "ERROR: Cannot register early for an quest!", error: "Cannot Register for quest that's not scheduled for the `DAY`"};
  }

  return {success: true, message: "NONE", error: "NONE"};
}

function validateQuestOrder(
    questOrderDoc: any
) {
  if (questOrderDoc.exists) {
    return {
      success: false,
      message: "ERROR: User already Registered!",
      quest_order_id: questOrderDoc.id,
      quest_status: questOrderDoc.data.status,
      error: "User already Registered.",
    };
  }

  return {success: true, message: "NONE", error: "NONE"};
}
