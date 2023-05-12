/* eslint-disable max-len */
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";

export async function exportSecret() {
  const client = new SecretManagerServiceClient();
  const name = `projects/${process.env.FIREBASE_PROJECT_ID}/secrets/CAPX_APP/versions/latest`;
  const [version] = await client.accessSecretVersion({
    name: name,
  });

  // Extract the payload as a string.
  const payload: any = version.payload?.data?.toString();
  return JSON.parse(payload);
}
