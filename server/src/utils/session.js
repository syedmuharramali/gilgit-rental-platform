const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/*
|--------------------------------------------------------------------------
| Sessions: everything about the sign-in cookie lives here
|--------------------------------------------------------------------------
|
| 1. Signing in creates a JWT and stores it ONLY in an httpOnly cookie.
|    Page scripts can't read it, so an XSS bug can't steal it.
|
| 2. Because the browser sends that cookie automatically, every
|    state-changing request must also carry an X-CSRF-Token header. The
|    token is an HMAC of the session JWT: the server can recompute it
|    without storing anything, and another site can't obtain it.
|
| Environment
|   COOKIE_SAME_SITE  lax (default) | strict | none
|                     "none" only if the website and API are on different
|                     sites; the cookie is then always Secure.
|   COOKIE_SECURE     true | false (default: true in production)
|--------------------------------------------------------------------------
*/

const SESSION_COOKIE = "gr_session";
const CSRF_HEADER = "x-csrf-token";

// One lifetime for both the JWT and the cookie that carries it.
const SESSION_DAYS = 7;
const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| Cookie
|--------------------------------------------------------------------------
*/

const cookieOptions = () => {
  const sameSiteSetting = String(process.env.COOKIE_SAME_SITE || "lax").trim().toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(sameSiteSetting) ? sameSiteSetting : "lax";

  // An empty COOKIE_SECURE= line (as in .env.example) counts as unset.
  const secureSetting = String(process.env.COOKIE_SECURE ?? "").trim().toLowerCase();
  const secure =
    sameSite === "none" ||
    (secureSetting ? secureSetting === "true" : process.env.NODE_ENV === "production");

  return { httpOnly: true, secure, sameSite, path: "/" };
};

const getSessionToken = (req) => {
  const token = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" && token ? token : null;
};

const clearSessionCookie = (res) => {
  // Must use the same attributes it was set with, or the browser keeps it.
  res.clearCookie(SESSION_COOKIE, cookieOptions());
};

/*
|--------------------------------------------------------------------------
| CSRF token
|--------------------------------------------------------------------------
*/

const csrfTokenFor = (sessionToken) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`csrf:${sessionToken}`)
    .digest("base64url");

const isValidCsrfToken = (sessionToken, provided) => {
  if (!sessionToken || typeof provided !== "string" || !provided) return false;

  const expected = Buffer.from(csrfTokenFor(sessionToken));
  const actual = Buffer.from(provided);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

/*
|--------------------------------------------------------------------------
| Start / read a session
|--------------------------------------------------------------------------
*/

// Signs the user in: sets the cookie, returns the CSRF token for the page.
const startSession = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
  });

  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_MAX_AGE_MS });

  return csrfTokenFor(token);
};

// The user id inside a valid session token, or null if missing/invalid/expired.
const readSessionUserId = (req) => {
  const token = getSessionToken(req);
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET).userId || null;
  } catch {
    return null;
  }
};

module.exports = {
  SESSION_COOKIE,
  CSRF_HEADER,
  getSessionToken,
  clearSessionCookie,
  csrfTokenFor,
  isValidCsrfToken,
  startSession,
  readSessionUserId,
};
