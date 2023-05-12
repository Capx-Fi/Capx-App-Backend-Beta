/* eslint-disable max-len */
import * as crypto from "crypto";
import {db} from "../init/init";
import {getUsernameFromId} from "../twitter/getUsernameFromId";

export async function createOrg(
    token: any,
    data: any
) {
  if (!token?.email) {
    return {success: false, message: "ERROR: Invalid Token"};
  }
  if (token?.email.toString() != "shreyas@capx.global") {
    return {success: false, message: "ERROR: Insufficient Permissions"};
  }

  try {
    // Check if Email is unique
    const _checkEmail = await db.collection("xorgs").where("email", "==", token?.email?.toString()).get();
    if (_checkEmail.size > 0) {
      return {success: false, message: "ERROR: Organisation email already linked."};
    }
    // Check if Twitter ID is unique
    let twitterUsername = "";
    if (token?.firebase?.identities["twitter.com"]) {
      twitterUsername = await getUsernameFromId(token?.firebase?.identities["twitter.com"][0].toString());
      const _checkTwitter = await db.collection("xorgs").where("socials.twitter_id", "==", token?.firebase?.identities["twitter.com"][0].toString()).get();
      if (_checkTwitter.size > 0) {
        return {success: false, message: "ERROR: Twitter already linked."};
      }
    }
    // Check if Gmail ID is unique
    if (token?.firebase?.identities["google.com"]) {
      const _checkGoogle = await db.collection("xorgs").where("socials.google_id", "==", token?.firebase?.identities["google.com"][0].toString()).get();
      if (_checkGoogle.size > 0) {
        return {success: false, message: "ERROR: Google already linked."};
      }
    }
    const orgObject = {
      doc_type: "Individual",
      name: data.name,
      description: data.description,
      image: token?.picture ? token?.picture.toString() : "",
      tags: data.tags,
      listed_quests: Number(0),
      website: data.website,
      email: token?.email,
      socials: {
        "twitter_id": token?.firebase?.identities["twitter.com"] ? token?.firebase?.identities["twitter.com"][0].toString() : "",
        "google_id": token?.firebase?.identities["google.com"] ? token?.firebase?.identities["google.com"][0] : "",
      },
    };
    const _email: string = token?.email?.toString();
    const _orgId = crypto.createHash("sha256").update(_email).digest("base64");

    const _org = db.collection("xorgs").doc(_orgId);
    const _response = await _org.create(orgObject);
    if (_response) {
      const orgPublic: any = {
        doc_type: "Individual",
        name: data.name,
        description: data.description,
        image: token?.picture ? token?.picture.toString() : "",
        tags: data.tags,
        listed_quests: Number(0),
        website: data.website,
      };
      if (twitterUsername !== "") {
        orgPublic["socials"] = {twitter_username: twitterUsername};
      }
      const _orgPublic = db.collection("xorgs").doc(_orgId).collection("public").doc("public");
      const _responsePub = await _orgPublic.create(orgPublic);
      if (_responsePub) {
        return {success: true, message: "SUCCESS: Organisation created."};
      }
      await db.collection("xorgs").doc(_orgId).delete();
      return {success: false, message: "ERROR: Creating Organisation!"};
    } else {
      return {success: false, message: "ERROR: Creating Organisation!"};
    }
  } catch (err) {
    console.error(err);
    return {success: false, message: "ERROR!"};
  }
}
