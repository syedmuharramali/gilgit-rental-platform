/*
 * The sign-in token now lives only in an httpOnly cookie that page scripts
 * can't read. What the page keeps is the CSRF token the server hands back
 * with the session: held in memory only (never localStorage), and sent as
 * X-CSRF-Token so the API knows a request really came from this site.
 */

let csrfToken = null

export const setCsrfToken = (value) => {
  csrfToken = typeof value === 'string' && value ? value : null
}

export const getCsrfToken = () => csrfToken

export const CSRF_HEADER = 'X-CSRF-Token'

// Older versions kept the token and user in localStorage. Remove them so a
// token saved there before this change can't linger or be read by scripts.
export const clearLegacyStorage = () => {
  try {
    localStorage.removeItem('gilgit_rental_token')
    localStorage.removeItem('gilgit_rental_user')
  } catch {
    // Storage can be unavailable (private mode); nothing to clean then.
  }
}
