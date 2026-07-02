// Server-only helpers for Zalo OAuth v4.
// Never import this file into route/component/*.functions.ts top-level scope
// (its filename `.server.ts` blocks it from client bundles).

import { createHash, randomBytes } from "crypto";

const ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/access_token";
const ZALO_GRAPH_ME_URL = "https://graph.zalo.me/v2.0/me";

export function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(48));
}

export function generateState(): string {
  return base64UrlEncode(randomBytes(24));
}

export function codeChallengeFromVerifier(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

/** Normalize Zalo-returned phone (+8498..., 8498..., 098...) to local 0-prefixed VN format. */
export function normalizeVNPhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let p = String(raw).replace(/[^\d+]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length >= 11) p = "0" + p.slice(2);
  if (!/^0\d{9,10}$/.test(p)) return null;
  return p;
}

export type ZaloTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  error?: number | string;
  error_description?: string;
  error_name?: string;
};

export async function exchangeZaloCode(params: {
  code: string;
  codeVerifier: string;
  appId: string;
  appSecret: string;
}): Promise<ZaloTokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    app_id: params.appId,
    grant_type: "authorization_code",
    code_verifier: params.codeVerifier,
  });
  const res = await fetch(ZALO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: params.appSecret,
    },
    body: body.toString(),
  });
  return (await res.json()) as ZaloTokenResponse;
}

export type ZaloMeResponse = {
  id?: string;
  name?: string;
  picture?: { data?: { url?: string } };
  phone?: string;
  error?: number;
  message?: string;
};

export async function fetchZaloMe(accessToken: string): Promise<ZaloMeResponse> {
  const url = `${ZALO_GRAPH_ME_URL}?fields=id,name,picture,phone`;
  const res = await fetch(url, {
    headers: { access_token: accessToken },
  });
  return (await res.json()) as ZaloMeResponse;
}
