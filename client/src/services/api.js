import axios from 'axios'
import { CSRF_HEADER, getCsrfToken, setCsrfToken } from './session'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  // Send the httpOnly session cookie with every request.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken()

  if (csrfToken) {
    config.headers[CSRF_HEADER] = csrfToken
  }

  return config
})

/*
| The store imports this module (through authSlice), so this module cannot
| import the store back. store.js registers the sign-out handler instead.
*/
let onSessionEnded = null

export const setSessionEndedHandler = (handler) => {
  onSessionEnded = handler
}

let getCurrentUserId = null

export const setCurrentUserGetter = (getter) => {
  getCurrentUserId = getter
}

export const isSessionEndedError = (status, code) =>
  status === 401 || (status === 403 && code === 'ACCOUNT_INACTIVE')

export const isCsrfError = (status, code) => status === 403 && code === 'CSRF_INVALID'

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // The CSRF token no longer matches the cookie (e.g. someone signed in
    // again in another tab). Fetch the current one and retry once.
    if (config && !config._csrfRetried && isCsrfError(error.response?.status, error.response?.data?.code)) {
      config._csrfRetried = true
      try {
        const { data } = await api.get('/auth/session')
        const sessionUser = data.data?.user

        if (!sessionUser) {
          onSessionEnded?.()
        } else if (String(sessionUser.id) !== String(getCurrentUserId?.())) {
          // Another tab signed in as someone else: don't replay this request
          // as them; reload so the page shows who is really signed in.
          window.location.reload()
        } else {
          setCsrfToken(data.data.csrfToken)
          return api(config)
        }
      } catch {
        // Couldn't check (offline, rate limit): keep the session, surface the error.
      }
    }

    if (isSessionEndedError(error.response?.status, error.response?.data?.code)) {
      // Sign the person out in Redux too, instead of leaving a dashboard
      // where every request then fails.
      onSessionEnded?.()
    }

    return Promise.reject(error)
  },
)

export default api
