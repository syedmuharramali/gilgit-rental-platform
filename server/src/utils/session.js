const crypto = require("crypto");

/*
|--------------------------------------------------------------------------
| Session cookie + CSRF token
|--------------------------------------------------------------------------
|
| The sign-in token (a JWT) lives only in an httpOnly cookie. Page scripts
| can't read it, so a cross-site-scripting bug can no longer steal it the
| way it could from localStorage.
|
| Because the browser now attaches the cookie by itself, a request forged
| from another site would carry it too. So every state-changing request
| must also send an X-CSRF-Token header. That value is an HMAC of the
| session token: the server can recompute it without storing anything,
| and another site can't obtain it (CORS stops it reading our responses,
| and the cookie itself is unreadable).
|
| Environment
|   COOKIE_SAME_SITE   lax (default) | strict | none
|                      Use "none" only when the API and the website are on
|                      different sites (e.g. *.onrender.com + *.vercel.app).
|   COOKIE_SECURE      true | false. Defaults to true in production, and is
|                      forced on with SameSite=None (browsers require it).
|--------------------------------------------------------------------------
*/

const SESSION_COOKIE = "gr_session";
const CSRF_HEADER = "x-csrf-token";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = () => {
  const sameSiteSetting = String(process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(sameSiteSetting)
    ? sameSiteSetting
    : "lax";

  const secure =
    sameSite === "none" ||
    (process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production");

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: SESSION_MAX_AGE_MS,
  });
};

const clearSessionCookie = (res) => {
  // Must match the attributes it was set with, or the browser keeps it.
  res.clearCookie(SESSION_COOKIE, baseCookieOptions());
};

const getSessionToken = (req) => {
  const token = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" && token.length > 0 ? token : null;
};

const csrfTokenFor = (sessionToken) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`csrf:${sessionToken}`)
    .digest("base64url");

const isValidCsrfToken = (sessionToken, provided) => {
  if (!sessionToken || typeof provided !== "string" || !provided) {
    return false;
  }

  const expected = Buffer.from(csrfTokenFor(sessionToken));
  const actual = Buffer.from(provided);

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
};

module.exports = {
  SESSION_COOKIE,
  CSRF_HEADER,
  SESSION_MAX_AGE_MS,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
  csrfTokenFor,
  isValidCsrfToken,
};
