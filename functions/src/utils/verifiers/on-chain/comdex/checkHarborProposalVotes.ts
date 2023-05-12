/* eslint-disable max-len */
import fetch from "node-fetch";

export async function getResult(
    address: string,
    actionData: any,
) {
  try {
    const secrets: any = await (await import("../../../config/config")).exportSecret();
    const baseURL: string = secrets.COMDEX_HARBOR_BASE_URL;
    const proposalCountMap: any = secrets.COMDEX_HARBOR_PROPOSAL_MAP;
    const voteMap: any = secrets.COMDEX_HARBOR_VOTE_MAP;
    const minVotedProposal = Number(actionData?.min_voted_proposals);

    const isVoter = await checkIfVoted(
        baseURL,
        address,
        voteMap,
        proposalCountMap,
        minVotedProposal
    );

    if (isVoter.success) {
      return {
        success: isVoter.success,
        error: isVoter.error,
        message: isVoter.message,
      };
    }
    return {
      success: isVoter.success,
      error: isVoter.error,
      message: isVoter.message,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "ERROR",
      error: `Something Wrong happened: (Harbor Proposal Vote) \nError Details: \t${err}`,
    };
  }
}

async function checkIfVoted(
    baseURL: string,
    address: string,
    voteMap: any,
    proposalMap: any,
    minVotedProposal: number,
) {
  const reqOptions: any = {
    method: "GET",
    headers: {
      "accept": "application/json",
    },
    redirect: "follow",
  };

  const proposalEncode: string = Buffer.from(JSON.stringify(proposalMap), "utf-8").toString("base64");

  const proposalResponse = await fetch(
      `${baseURL}/${proposalEncode}`,
      reqOptions
  );

  try {
    if (proposalResponse.ok) {
      const proposalData: any = await proposalResponse.json();
      const proposalCount = Number(proposalData?.data?.proposal_count);

      let proposalVoted = 0;
      for (let i = 1; i <= proposalCount; i++) {
        voteMap["vote"]["proposal_id"] = i;
        voteMap["vote"]["voter"] = address;

        const voteEncode: string = Buffer.from(JSON.stringify(voteMap), "utf-8").toString("base64");

        const voteResponse = await fetch(
            `${baseURL}/${voteEncode}`,
            reqOptions
        );

        try {
          if (voteResponse.ok) {
            const voteData: any = await voteResponse.json();
            if (voteData?.data?.vote !== null) {
              proposalVoted += 1;
            }
          } else {
            return {
              success: false,
              message: "ERROR: Processing Request.",
              error: `Invalid Response on Vote Response (Voter Fetch Failed) API Request.${voteResponse.statusText}`,
            };
          }
        } catch (err) {
          console.error(err);
          return {
            success: false,
            message: "ERROR: Processing Request.",
            error: `Something Went Wrong - checkIfVoted (Voter Fetch Failed) - ${err}`,
          };
        }
      }
      if (proposalVoted >= minVotedProposal) {
        return {
          success: true,
          message: "NONE",
          error: "NONE",
        };
      }
      return {
        success: false,
        message: "User hasn't voted on enough Proposals.",
        error: "User hasn't voted on enough Proposals.",
      };
    }
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Invalid Response on Proposal Count (Voter Fetch Failed) API Request.${proposalResponse.statusText}`,
    };
  } catch (err) {
    console.error("Proposal Count", err);
    return {
      success: false,
      message: "ERROR: Processing Request.",
      error: `Something Went Wrong - checkIfVoted (Proposal Count Fetched) - ${err}`,
    };
  }
}
