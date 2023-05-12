/* eslint-disable max-len */
import {db} from "../init/init";
import {DocumentData, DocumentReference, WriteBatch} from "firebase-admin/firestore";

export async function deleteInviteCodeLock(
    batch: WriteBatch,
    inviteCode: string
) {
  const _inviteCodeUnlock = db.collection("xinvite_codes_lock").doc(inviteCode);
  batch.delete(_inviteCodeUnlock);
  return batch;
}

export async function createInviteCodeLock(
    inviteCodeLockRef: DocumentReference<DocumentData>,
    userId: string,
    lockTime: number
) {
  const response = await inviteCodeLockRef.set({uid: userId, locked_time: lockTime});
  if (response) {
    return true;
  }
  return false;
}
