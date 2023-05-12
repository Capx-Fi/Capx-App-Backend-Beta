/* eslint-disable max-len */
import {exportSecret} from "../config/config";
import axios from "axios";

export async function checkIfUserFollows(
    userId: string,
    userIdToFollow: string
) {
  try {
    // CHECKING IF USER FOLLOWS COMPANY
    // CHECKING USER'S FOLLOWING LIST
    const secrets: any = await exportSecret();
    try {
      let paginationToken = "-1";
      const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
      console.log("Bearer Token: ", BEARER_TOKEN);
      while (paginationToken != undefined) {
        const response = await axios.get("https://api.twitter.com/2/users/"+userId+"/following", {
          headers: {
            Authorization: "Bearer " + BEARER_TOKEN,
          },
          params: {
            "max_results": 100,
            "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
          },
        });
        if (response.data.errors != undefined) {
          if (response.data.errors[0].title == "Rate Limit Exceeded") {
            console.log("Rate Limit Exceeded");
          } else if (response.data.errors[0].title == "Not Authorized") {
            console.log("Private Account");
          }
          break;
        }
        for (let i = 0; i < response.data.meta.result_count; i++) {
          if (response.data.data[i].id == userIdToFollow) {
            return true;
          }
        }
        paginationToken = response.data.meta?.next_token;
      }
    } catch (error) {
      console.log(error);
    }
    // CHECKING COMPANY'S FOLLOWERS LIST
    let paginationToken = "-1";
    const BEARER_TOKEN = secrets.BEARER_TOKEN[Math.floor(Math.random() * secrets.BEARER_TOKEN.length)];
    console.log("Bearer Token: ", BEARER_TOKEN);
    while (paginationToken != undefined) {
      const response = await axios.get("https://api.twitter.com/2/users/"+userIdToFollow+"/followers", {
        headers: {
          Authorization: "Bearer " + BEARER_TOKEN,
        },
        params: {
          "max_results": 1000,
          "pagination_token": paginationToken == "-1" ? undefined : paginationToken,
        },
      });
      paginationToken = response.data.meta.next_token;
      for (let i = 0; i < response.data.data.length; i++) {
        if (response.data.data[i].id == userId) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return false;
}
