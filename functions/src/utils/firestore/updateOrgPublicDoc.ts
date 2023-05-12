/* eslint-disable max-len */
import {db} from "../init/init";

export async function updateOrgPublicDoc(
    newOrgData: any,
    orgId: string
) {
  const orgPublic: any = {
    doc_type: "Individual",
    name: newOrgData.name,
    description: newOrgData.description,
    image: newOrgData.image,
    tags: newOrgData.tags,
    listed_quests: newOrgData.listed_quests,
    website: newOrgData.website,
  };

  await db.collection("xorgs").doc(orgId).collection("public").doc("public").update(orgPublic);
}
