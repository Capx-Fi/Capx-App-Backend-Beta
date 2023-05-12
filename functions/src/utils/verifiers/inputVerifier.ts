/* eslint-disable max-len */
import fetch from "node-fetch";
import {URL} from "url";

export function urlVerifier(url : string) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function checkImage(url : string) {
  const res = await fetch(url);
  const buff = await res.blob();
  return buff.type.startsWith("image/");
}

export async function imageUrlVerifier(photoUrl : string) {
  const response1 = urlVerifier(photoUrl);
  if (response1) {
    const response2 = await checkImage(photoUrl);
    return response2;
  }
  return false;
}

export function twitterUrlVerifier(url : string) {
  const twitterRegex = new RegExp("^(https://twitter.com/)([a-zA-Z0-9_]{1,15})$");
  return twitterRegex.test(url);
}

export function tweetUrlVerifier(url : string) {
  const tweetUrl = url.split("?")[0];
  const tweetRegex = new RegExp("^(https://twitter.com/)([a-zA-Z0-9_]{1,15})(/status/)([0-9]{1,20})$");
  return tweetRegex.test(tweetUrl);
}

export function emailVerifierRegex(emailId : string) {
  const emailRegex = new RegExp("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$");
  return emailRegex.test(emailId);
}

export function docLinkVerifier(docLink: string) {
  return true;
}

export function comdexAddressVerifier(evmAddress : string) {
  const evmRegex = new RegExp("^comdex[a-zA-Z0-9]{39}$");
  return evmRegex.test(evmAddress);
}

export function evmAddressVerifier(evmAddress : string) {
  const evmRegex = new RegExp("^0x[a-fA-F0-9]{40}$");
  return evmRegex.test(evmAddress);
}
