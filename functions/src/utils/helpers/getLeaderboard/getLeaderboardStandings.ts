/* eslint-disable max-len */
import {db} from "../../init/init";

export async function getLeaderboardStandings(
    token: any,
    maxPositions = 10
) {
  if (token?.uid) {
    const _users = await db.collection("xusers").orderBy("type").where("type", "!=", "Admin").orderBy("earned_rewards", "desc").limit(maxPositions).get();
    // As there would be atleast one user whom would be calling this.
    const _leaderboardStandings: any = [];
    let _position = 1;
    _users.docs.forEach((_user) => {
      const user: any = _user.data();
      const userData = {
        position: _position,
        image_url: user?.image_url,
        username: "@"+user?.username,
        earned_rewards: user?.earned_rewards,
        quests: user?.quests_completed,
      };
      _leaderboardStandings.push(userData);
      _position += 1;
    });
    return {success: true, message: "SUCCESS", leaderboard: _leaderboardStandings, error: "NONE"};
  }
  return {success: false, message: "ERROR: Invalid Token", error: "Missing `uid` in token."};
}
