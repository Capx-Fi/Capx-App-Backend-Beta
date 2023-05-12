/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";

export async function getUsernameFromId(
    userId: string
) {
  try {
    const secrets: any = await exportSecret();
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    const response = await axios.get("https://api.twitter.com/2/users/" + userId, {
      headers: {
        Authorization: "Bearer " + BEARER_TOKEN,
      },
    });
    console.log("Username", response.data);
    return response.data.data.username;
  } catch (err) {
    console.log("ERROR:", err);
    return "";
  }
}
