const AppError = require("../utils/AppError");
const {
  CSRF_HEADER,
  getSessionToken,
  isValidCsrfToken,
} = require("../utils/session");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/*
| Sign-in style endpoints don't rely on an existing session, so they don't
| need the header (a stale cookie must never block someone from logging
| in). Logout is exempt so a lost token can't trap anyone signed in.
*/
const EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/logout",
]);

/*
|--------------------------------------------------------------------------
| CSRF protection for cookie sessions
|--------------------------------------------------------------------------
|
| Any state-changing request that arrives with our session cookie must
| carry the matching X-CSRF-Token header. Requests without the cookie are
| anonymous and are left to the normal auth checks.
*/
const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const path = req.path.replace(/\/+$/, "") || "/";
  if (EXEMPT_PATHS.has(path)) return next();

  const sessionToken = getSessionToken(req);
  if (!sessionToken) return next();

  if (isValidCsrfToken(sessionToken, req.get(CSRF_HEADER))) return next();

  const error = new AppError(
    "Your session security check failed. Refresh the page and try again.",
    403
  );
  error.code = "CSRF_INVALID";
  return next(error);
};

module.exports = csrfProtection;
