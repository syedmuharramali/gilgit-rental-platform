const https = require("https");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/oauth2/v3/certs";

const GOOGLE_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);

let cachedKeys = new Map();
let cacheExpiresAt = 0;
let pendingKeyRefresh = null;

const parseMaxAge = (
  cacheControl = ""
) => {
  const match =
    cacheControl.match(
      /(?:^|,)\s*max-age=(\d+)/i
    );

  if (!match) {
    return 3600;
  }

  const seconds =
    Number(match[1]);

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return 3600;
  }

  return seconds;
};

// Development-only diagnostics: why a Google sign-in was refused.
const logGoogleIssue = (message) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Google sign-in] ${message}`);
  }
};

const JWKS_HARD_TIMEOUT_MS = 8000;

/*
| Fetch Google's signing keys, but never wait longer than 8 s in total.
| The socket timeout alone doesn't cover every stall (e.g. a response
| that starts and then stops), and a stuck fetch here used to leave every
| later Google sign-in waiting on it forever.
*/
const fetchGoogleJwks = () =>
  Promise.race([
    fetchGoogleJwksOnce(),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            Object.assign(
              new Error("no answer within 8 seconds"),
              { hardTimeout: true }
            )
          ),
        JWKS_HARD_TIMEOUT_MS
      ).unref()
    ),
  ]).catch((error) => {
    logGoogleIssue(
      `Could not download Google's signing keys from ${GOOGLE_JWKS_URL}: ${error?.cause?.message || error?.message}. Check that this computer can reach www.googleapis.com.`
    );

    throw error instanceof AppError
      ? error
      : new AppError(
          "Google authentication is temporarily unavailable",
          503
        );
  });

const fetchGoogleJwksOnce = () =>
  new Promise(
    (resolve, reject) => {
      const request =
        https.get(
          GOOGLE_JWKS_URL,
          {
            timeout: 5000,
            headers: {
              Accept:
                "application/json",
              "User-Agent":
                "gilgit-rental-platform",
            },
          },
          (response) => {
            if (
              response.statusCode !==
              200
            ) {
              response.resume();

              return reject(
                new AppError(
                  "Google authentication is temporarily unavailable",
                  503
                )
              );
            }

            let body = "";

            response.setEncoding(
              "utf8"
            );

            // A connection dropped mid-body must fail, not hang.
            response.on("error", reject);
            response.on("aborted", () =>
              reject(new Error("Google closed the connection early"))
            );

            response.on(
              "data",
              (chunk) => {
                body += chunk;

                if (
                  body.length >
                  1024 * 1024
                ) {
                  request.destroy(
                    new Error(
                      "Google JWKS response exceeded the allowed size"
                    )
                  );
                }
              }
            );

            response.on(
              "end",
              () => {
                try {
                  const payload =
                    JSON.parse(body);

                  resolve({
                    payload,
                    cacheControl:
                      response.headers[
                        "cache-control"
                      ] || "",
                  });
                } catch (_) {
                  reject(
                    new AppError(
                      "Google authentication is temporarily unavailable",
                      503
                    )
                  );
                }
              }
            );
          }
        );

      request.on(
        "timeout",
        () => {
          request.destroy(
            new Error(
              "Google JWKS request timed out"
            )
          );
        }
      );

      request.on(
        "error",
        (error) => {
          if (
            error instanceof
            AppError
          ) {
            return reject(error);
          }

          reject(
            Object.assign(
              new AppError(
                "Google authentication is temporarily unavailable",
                503
              ),
              { cause: error }
            )
          );
        }
      );
    }
  );

const refreshGoogleKeys =
  async () => {
    if (pendingKeyRefresh) {
      return pendingKeyRefresh;
    }

    pendingKeyRefresh =
      (async () => {
        const {
          payload,
          cacheControl,
        } =
          await fetchGoogleJwks();

        if (
          !payload ||
          !Array.isArray(
            payload.keys
          )
        ) {
          throw new AppError(
            "Google authentication is temporarily unavailable",
            503
          );
        }

        const nextKeys =
          new Map();

        for (
          const jwk of
          payload.keys
        ) {
          if (
            !jwk?.kid ||
            jwk.kty !== "RSA"
          ) {
            continue;
          }

          try {
            const key =
              crypto.createPublicKey({
                key: jwk,
                format: "jwk",
              });

            nextKeys.set(
              jwk.kid,
              key
            );
          } catch (_) {}
        }

        if (
          nextKeys.size === 0
        ) {
          throw new AppError(
            "Google authentication is temporarily unavailable",
            503
          );
        }

        cachedKeys = nextKeys;

        cacheExpiresAt =
          Date.now() +
          parseMaxAge(
            cacheControl
          ) *
            1000;
      })();

    try {
      await pendingKeyRefresh;
    } finally {
      pendingKeyRefresh =
        null;
    }
  };

const getGooglePublicKey =
  async (kid) => {
    const cacheExpired =
      Date.now() >=
      cacheExpiresAt;

    if (
      cacheExpired ||
      !cachedKeys.has(kid)
    ) {
      await refreshGoogleKeys();
    }

    const key =
      cachedKeys.get(kid);

    if (!key) {
      logGoogleIssue(
        `Google's token was signed with an unknown key (kid ${kid}).`
      );
      throw new AppError(
        "Invalid Google credential",
        401
      );
    }

    return key;
  };

const verifyGoogleCredential =
  async (credential) => {
    if (
      typeof credential !==
        "string" ||
      !credential.trim() ||
      credential.length >
        10000
    ) {
      throw new AppError(
        "A valid Google credential is required",
        400
      );
    }

    const token =
      credential.trim();

    const decoded =
      jwt.decode(token, {
        complete: true,
      });

    if (
      !decoded?.header?.kid ||
      decoded.header.alg !==
        "RS256"
    ) {
      throw new AppError(
        "Invalid Google credential",
        401
      );
    }

    const publicKey =
      await getGooglePublicKey(
        decoded.header.kid
      );

    let payload;

    try {
      payload = jwt.verify(
        token,
        publicKey,
        {
          algorithms: [
            "RS256",
          ],
          audience:
            process.env
              .GOOGLE_CLIENT_ID,
        }
      );
    } catch (error) {
      // The usual cause is two different client IDs: the website asks
      // Google for a token for VITE_GOOGLE_CLIENT_ID, the server only
      // accepts GOOGLE_CLIENT_ID.
      if (error?.name === "JsonWebTokenError" && /audience/i.test(error.message)) {
        logGoogleIssue(
          `Client ID mismatch. The token was issued for "${decoded.payload?.aud}", but server/.env GOOGLE_CLIENT_ID is "${process.env.GOOGLE_CLIENT_ID}". Use the same Web client ID in client/.env (VITE_GOOGLE_CLIENT_ID) and server/.env (GOOGLE_CLIENT_ID).`
        );
      } else {
        logGoogleIssue(
          `Token rejected: ${error?.message}. If it says "jwt expired", check this computer's clock and time zone.`
        );
      }

      throw new AppError(
        "Invalid or expired Google credential",
        401
      );
    }

    if (
      !GOOGLE_ISSUERS.has(
        payload.iss
      )
    ) {
      throw new AppError(
        "Invalid Google credential issuer",
        401
      );
    }

    if (
      !payload.sub ||
      !payload.email ||
      payload.email_verified !==
        true
    ) {
      throw new AppError(
        "Google account information is incomplete or unverified",
        401
      );
    }

    return {
      googleId:
        String(payload.sub),

      email:
        String(payload.email)
          .trim()
          .toLowerCase(),

      emailVerified: true,

      name:
        typeof payload.name ===
        "string"
          ? payload.name.trim()
          : "",

      picture:
        typeof payload.picture ===
        "string"
          ? payload.picture.trim()
          : null,

      hostedDomain:
        typeof payload.hd ===
        "string"
          ? payload.hd.trim()
          : null,
    };
  };

const isGoogleAuthoritativeEmail =
  ({
    email,
    emailVerified,
    hostedDomain,
  }) => {
    return (
      email.endsWith(
        "@gmail.com"
      ) ||
      Boolean(
        emailVerified &&
          hostedDomain
      )
    );
  };

module.exports = {
  verifyGoogleCredential,
  isGoogleAuthoritativeEmail,
};