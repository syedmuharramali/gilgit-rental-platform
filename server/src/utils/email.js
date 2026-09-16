const GMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
]);

const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

/*
|--------------------------------------------------------------------------
| Email lookup candidates
|--------------------------------------------------------------------------
|
| Earlier versions used express-validator's default normalizeEmail(), which
| silently removed dots and "+tags" from Gmail addresses before saving
| (syed.ali@gmail.com was stored as syedali@gmail.com). Emails are now stored
| exactly as typed (lower-cased), and this helper keeps those older accounts
| reachable. The exact address is always the first candidate.
|--------------------------------------------------------------------------
*/

const getEmailLookupCandidates = (email) => {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf("@");
  const candidates = [normalized];

  if (atIndex > 0) {
    const localPart = normalized.slice(0, atIndex);
    const domain = normalized.slice(atIndex + 1);

    if (GMAIL_DOMAINS.has(domain)) {
      const legacy = `${localPart
        .split("+")[0]
        .replace(/\./g, "")}@gmail.com`;

      if (!candidates.includes(legacy)) {
        candidates.push(legacy);
      }
    }
  }

  return candidates;
};

module.exports = {
  normalizeEmail,
  getEmailLookupCandidates,
};
