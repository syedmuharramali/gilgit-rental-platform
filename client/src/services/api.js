import axios from 'axios'
import i18n from '../i18n/config'


/*
 * The one HTTP client for the whole app. RTK Query endpoints (see
 * features/api/baseApi.js) and the auth thunks both go through it, so the
 * session rules below live in exactly one place.
 *
 * Session model
 * - The sign-in token is an httpOnly cookie the server sets. This code never
 *   sees it; `withCredentials` just lets the browser send it.
 * - The server also hands out a CSRF token. It is kept here in memory only
 *   (never localStorage) and sent as X-CSRF-Token on every request.
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/* ------------------------------------------------------------------ */
/* CSRF token (memory only)                                            */
/* ------------------------------------------------------------------ */

let csrfToken = null

export const setCsrfToken = (value) => {
  csrfToken = typeof value === 'string' && value ? value : null
}

api.interceptors.request.use((config) => {
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken
  return config
})

/* ------------------------------------------------------------------ */
/* Hooks the store plugs in (the store imports this file, so this file */
/* can't import the store)                                             */
/* ------------------------------------------------------------------ */

let sessionHooks = {
  onSessionEnded: () => {},
  getCurrentUserId: () => null,
}

export const configureSessionHooks = (hooks) => {
  sessionHooks = { ...sessionHooks, ...hooks }
}

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

const isSessionEnded = (status, code) => status === 401 || (status === 403 && code === 'ACCOUNT_INACTIVE')
const isCsrfRejected = (status, code) => status === 403 && code === 'CSRF_INVALID'

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    const config = error.config

    // The CSRF token no longer matches the cookie (e.g. signed in again in
    // another tab). Fetch the current one and retry once — but only for the
    // same person, never replay a request as someone else.
    if (config && !config.csrfRetried && isCsrfRejected(status, code)) {
      config.csrfRetried = true

      try {
        const { data } = await api.get('/auth/session')
        const sessionUser = data.data?.user

        if (!sessionUser) {
          sessionHooks.onSessionEnded()
        } else if (String(sessionUser.id) !== String(sessionHooks.getCurrentUserId())) {
          window.location.reload()
        } else {
          setCsrfToken(data.data.csrfToken)
          return api(config)
        }
      } catch {
        // Couldn't check (offline, rate limit): keep the session, show the error.
      }
    }

    if (isSessionEnded(status, code)) sessionHooks.onSessionEnded()

    return Promise.reject(error)
  },
)

/*
 * The message to show a person for an axios error: the server's own words
 * first, otherwise a translated reason instead of axios's raw English
 * ("Network Error", "timeout of 15000ms exceeded").
 */
export const errorMessageFor = (error) => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ECONNABORTED') return i18n.t('common.timeout')
  if (error && !error.response) return i18n.t('common.networkError')
  return i18n.t('common.somethingWrong')
}

/*
 * The error shape RTK Query and the pages expect: { status, data } for an
 * answer from the server, { status: 'FETCH_ERROR', error } when there was none.
 */
export const toRequestError = (error) =>
  error.response
    ? { status: error.response.status, data: error.response.data }
    : { status: 'FETCH_ERROR', error: errorMessageFor(error) }

// Older versions kept the token and user in localStorage. Remove them.
try {
  localStorage.removeItem('gilgit_rental_token')
  localStorage.removeItem('gilgit_rental_user')
} catch {
  // Storage can be unavailable (private mode); nothing to clean then.
}

export default api
