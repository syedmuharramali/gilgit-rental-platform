const https = require("https");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Google Sign-In: verify the ID token the browser got from Google
|--------------------------------------------------------------------------
|
| The website asks Google for an ID token (a JWT) for VITE_GOOGLE_CLIENT_ID
| and sends it here. We check it ourselves:
|   1. signed with one of Google's current public keys (RS256),
|   2. issued for our GOOGLE_CLIENT_ID (audience),
|   3. issued by Google, not expired, with a verified email.
| Google's keys are downloaded once and cached for as long as Google says.
|--------------------------------------------------------------------------
*/

const GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

const SOCKET_IDLE_TIMEOUT_MS = 5000; // no bytes for 5 s -> give up
const KEY_DOWNLOAD_TIMEOUT_MS = 8000; // whole download, whatever happens
const MAX_KEYS_RESPONSE_BYTES = 1024 * 1024;

const unavailable = () =>
  new AppError("Google authentication is temporarily unavailable", 503);

// Development-only: say why a Google sign-in was refused.
const logGoogleIssue = (message) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Google sign-in] ${message}`);
  }
};

/*
|--------------------------------------------------------------------------
| Google's public keys
|--------------------------------------------------------------------------
*/

let cachedKeys = new Map(); // kid -> KeyObject
let cacheExpiresAt = 0;
let refreshInFlight = null;

// "public, max-age=19302, ..." -> 19302 (seconds); 1 hour if missing.
const maxAgeSeconds = (cacheControl = "") => {
  const seconds = Number(/(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl)?.[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 3600;
};

const downloadKeysOnce = () =>
  new Promise((resolve, reject) => {
    const request = https.get(
      GOOGLE_KEYS_URL,
      {
        timeout: SOCKET_IDLE_TIMEOUT_MS,
        headers: { Accept: "application/json", "User-Agent": "gilgit-rental-platform" },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          return reject(new Error(`Google answered with HTTP ${response.statusCode}`));
        }

        let body = "";
        response.setEncoding("utf8");

        // A connection dropped mid-body must fail, not hang.
        response.on("error", reject);
        response.on("aborted", () => reject(new Error("Google closed the connection early")));

        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > MAX_KEYS_RESPONSE_BYTES) {
            request.destroy(new Error("Google's key list was unexpectedly large"));
          }
        });

        response.on("end", () => {
          try {
            resolve({ payload: JSON.parse(body), cacheControl: response.headers["cache-control"] || "" });
          } catch {
            reject(new Error("Google's key list was not valid JSON"));
          }
        });
      }
    );

    request.on("timeout", () => request.destroy(new Error("the connection timed out")));
    request.on("error", reject);
  });

/*
| Never wait longer than 8 s in total. The socket timeout alone doesn't
| cover every stall, and a stuck download here would leave every later
| Google sign-in waiting on it.
*/
const downloadKeys = () =>
  Promise.race([
    downloadKeysOnce(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`no answer within ${KEY_DOWNLOAD_TIMEOUT_MS / 1000} seconds`)),
        KEY_DOWNLOAD_TIMEOUT_MS
      ).unref()
    ),
  ]);

const refreshKeys = async () => {
  // Several sign-ins at once share one download.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      let download;

      try {
        download = await downloadKeys();
      } catch (error) {
        logGoogleIssue(
          `Could not download Google's signing keys from ${GOOGLE_KEYS_URL}: ${error.message}. Check that this computer can reach www.googleapis.com.`
        );
        throw unavailable();
      }

      const keys = new Map();

      const list = Array.isArray(download.payload?.keys) ? download.payload.keys : [];

      for (const jwk of list) {
        if (!jwk?.kid || jwk.kty !== "RSA") continue;

        try {
          keys.set(jwk.kid, crypto.createPublicKey({ key: jwk, format: "jwk" }));
        } catch {
          // Skip a key Node can't read; the others still work.
        }
      }

      if (keys.size === 0) {
        logGoogleIssue("Google's key list contained no usable keys.");
        throw unavailable();
      }

      cachedKeys = keys;
      cacheExpiresAt = Date.now() + maxAgeSeconds(download.cacheControl) * 1000;
    })();
  }

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

const getGooglePublicKey = async (kid) => {
  if (Date.now() >= cacheExpiresAt || !cachedKeys.has(kid)) {
    await refreshKeys();
  }

  const key = cachedKeys.get(kid);

  if (!key) {
    logGoogleIssue(`Google's token was signed with an unknown key (kid ${kid}).`);
    throw new AppError("Invalid Google credential", 401);
  }

  return key;
};

/*
|--------------------------------------------------------------------------
| Verify
|--------------------------------------------------------------------------
*/

const cleanString = (value) => (typeof value === "string" ? value.trim() : null);

const verifyGoogleCredential = async (credential) => {
  if (typeof credential !== "string" || !credential.trim() || credential.length > 10000) {
    throw new AppError("A valid Google credential is required", 400);
  }

  const token = credential.trim();
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded?.header?.kid || decoded.header.alg !== "RS256") {
    throw new AppError("Invalid Google credential", 401);
  }

  const publicKey = await getGooglePublicKey(decoded.header.kid);

  let payload;

  try {
    payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    if (error?.name === "JsonWebTokenError" && /audience/i.test(error.message)) {
      // The website asked Google for a token for a different client ID.
      logGoogleIssue(
        `Client ID mismatch. The token was issued for "${decoded.payload?.aud}", but server/.env GOOGLE_CLIENT_ID is "${process.env.GOOGLE_CLIENT_ID}". Use the same Web client ID in client/.env (VITE_GOOGLE_CLIENT_ID) and server/.env (GOOGLE_CLIENT_ID).`
      );
    } else {
      logGoogleIssue(
        `Token rejected: ${error?.message}. If it says "jwt expired", check this computer's clock and time zone.`
      );
    }

    throw new AppError("Invalid or expired Google credential", 401);
  }

  if (!GOOGLE_ISSUERS.has(payload.iss)) {
    throw new AppError("Invalid Google credential issuer", 401);
  }

  if (!payload.sub || !payload.email || payload.email_verified !== true) {
    throw new AppError("Google account information is incomplete or unverified", 401);
  }

  return {
    googleId: String(payload.sub),
    email: String(payload.email).trim().toLowerCase(),
    emailVerified: true,
    name: cleanString(payload.name) || "",
    picture: cleanString(payload.picture),
    hostedDomain: cleanString(payload.hd),
  };
};

/*
| Google is the authority for @gmail.com addresses and for Workspace
| domains (hd claim). Only then may a Google sign-in claim an existing
| account with the same email.
*/
const isGoogleAuthoritativeEmail = ({ email, emailVerified, hostedDomain }) =>
  email.endsWith("@gmail.com") || Boolean(emailVerified && hostedDomain);

module.exports = {
  verifyGoogleCredential,
  isGoogleAuthoritativeEmail,
};
