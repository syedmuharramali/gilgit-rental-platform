import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gilgit_rental_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

export const isSessionEndedError = (status, code) =>
  status === 401 || (status === 403 && code === 'ACCOUNT_INACTIVE')

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionEndedError(error.response?.status, error.response?.data?.code)) {
      // Clearing localStorage alone left Redux thinking the user was still
      // signed in, on a dashboard where every request then failed.
      onSessionEnded?.()
    }

    return Promise.reject(error)
  },
)

export default api
