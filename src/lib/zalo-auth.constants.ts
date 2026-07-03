// Shared constants for Zalo OAuth flow. Safe for both client and server bundles.
export const ZALO_STATE_COOKIE = "zalo_oauth_state";
export const ZALO_VERIFIER_COOKIE = "zalo_oauth_verifier";
export const CUSTOMER_EMAIL_DOMAIN = "@khach.vitath.pro";

export const ZALO_CANONICAL_ORIGIN = "https://cs1.vitath.pro";
export const ZALO_FALLBACK_ORIGIN = "https://view-forge-space.lovable.app";
export const ZALO_CALLBACK_PATH = "/auth/zalo/callback";
export const ZALO_AUTHORIZE_PATH = "/api/public/zalo/authorize";
