import i18n from '../../i18n/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/api'
import { clearLegacyStorage, setCsrfToken } from '../../services/session'

/*
 * Nothing about the session is stored in the browser any more. The server
 * sets an httpOnly cookie on sign-in; the page only keeps who is signed in
 * (in Redux) and the CSRF token (in memory, see services/session.js).
 */
clearLegacyStorage()

const persistSession = ({ csrfToken }) => {
  setCsrfToken(csrfToken)
}

const clearSession = () => {
  setCsrfToken(null)
}

// Server messages first; otherwise a translated reason instead of axios's
// raw English ("Network Error", "timeout of 15000ms exceeded").
const getErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ECONNABORTED') return i18n.t('common.timeout')
  if (!error.response) return i18n.t('common.networkError')
  return fallback
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials)
      persistSession(data.data)
      return data.data
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, 'Unable to sign in'),
        code: error.response?.data?.code || null,
        email: credentials?.email || null,
      })
    }
  },
)

/*
 * Registration no longer signs the user in. The account exists, but it stays
 * unusable until the emailed confirmation link is opened.
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload)
      return {
        email: data.data?.email || payload.email,
        emailSent: data.data?.emailSent !== false,
        message: data.message,
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to create account'))
    }
  },
)

export const verifyEmailToken = createAsyncThunk(
  'auth/verifyEmailToken',
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/verify-email', { token })
      persistSession(data.data)
      return data.data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'This confirmation link could not be used'))
    }
  },
)

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/resend-verification', { email })
      return data.message
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to send a new link'))
    }
  },
)

export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async (credential, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/google', { credential })
      persistSession(data.data)
      return data.data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Google sign-in failed'))
    }
  },
)

/*
 * On every page load: ask the server who (if anyone) the cookie belongs to.
 * Resolves with the user, or null for a visitor. Rejects only when the
 * server couldn't be reached, so a cold start isn't mistaken for signing out.
 */
export const hydrateCurrentUser = createAsyncThunk(
  'auth/hydrateCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    const startedAt = getState().auth.sessionEpoch

    try {
      const { data } = await api.get('/auth/session')

      // Someone signed in or out while this check was in flight; its answer
      // describes the old session, so ignore it entirely.
      if (getState().auth.sessionEpoch !== startedAt) return { stale: true }

      setCsrfToken(data.data?.csrfToken)
      return { user: data.data?.user || null }
    } catch (error) {
      // Keep what actually happened, so the screen can say it instead of a
      // generic "can't reach the server" (wrong URL, CORS block, 404, 500…).
      const config = error.config || {}
      return rejectWithValue({
        message: getErrorMessage(error, 'Unable to reach the server'),
        status: error.response?.status ?? null,
        url: `${config.baseURL || ''}${config.url || ''}`,
      })
    }
  },
)

// The cookie is httpOnly, so only the server can remove it.
export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  // Clear the page first so nothing still thinks it is signed in while the
  // request is in flight (the login page would bounce straight back).
  dispatch(logout())

  // Then have the server delete the cookie. One retry for a flaky network;
  // if both fail the cookie still expires on its own.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await api.post('/auth/logout')
      return
    } catch {
      // try again once
    }
  }
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/auth/me', payload)
      return data.data.user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to update profile'))
    }
  },
)

const initialState = {
  // True once the server has confirmed the session cookie (or a sign-in
  // just succeeded). The token itself is never visible to the page.
  isAuthenticated: false,
  user: null,
  status: 'idle',
  sessionChecked: false,
  // The server couldn't be reached while checking the session.
  sessionUnavailable: false,
  sessionError: null,
  sessionStatus: 'idle',
  // Bumped on every sign-in and sign-out, so a slow session check that
  // started before one can tell its answer is out of date.
  sessionEpoch: 0,
  error: null,
  // Set when an account exists but its email address is not confirmed yet.
  pendingVerificationEmail: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearSession()
      state.sessionEpoch += 1
      state.isAuthenticated = false
      state.user = null
      state.status = 'idle'
      state.error = null
      state.sessionChecked = true
      state.pendingVerificationEmail = null
    },
    clearAuthError(state) {
      state.error = null
    },
    clearPendingVerification(state) {
      state.pendingVerificationEmail = null
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading'
      state.error = null
    }

    const fulfilled = (state, action) => {
      state.status = 'succeeded'
      state.sessionEpoch += 1
      state.isAuthenticated = true
      state.user = action.payload.user
      state.sessionChecked = true
      state.sessionUnavailable = false
    }

    const rejected = (state, action) => {
      const payload = action.payload
      const isDetailed = payload && typeof payload === 'object'

      state.status = 'failed'
      state.error = (isDetailed ? payload.message : payload) || 'Authentication failed'
      state.sessionChecked = true

      if (isDetailed && payload.code === 'EMAIL_NOT_VERIFIED') {
        state.pendingVerificationEmail = payload.email || null
      }
    }

    builder
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.pendingVerificationEmail = action.payload.email
      })
      .addCase(registerUser.rejected, rejected)
      .addCase(verifyEmailToken.pending, pending)
      .addCase(verifyEmailToken.fulfilled, (state, action) => {
        fulfilled(state, action)
        state.pendingVerificationEmail = null
      })
      .addCase(verifyEmailToken.rejected, rejected)
      .addCase(googleSignIn.pending, pending)
      .addCase(googleSignIn.fulfilled, fulfilled)
      .addCase(googleSignIn.rejected, rejected)
      // The page-load session check has its own status: it must not mark
      // the login form or the Google button as "busy" (they were disabled
      // for as long as the check took, up to 15 s on a slow server).
      .addCase(hydrateCurrentUser.pending, (state) => {
        state.sessionStatus = 'loading'
        state.sessionUnavailable = false
      })
      .addCase(hydrateCurrentUser.fulfilled, (state, action) => {
        state.sessionStatus = 'idle'
        state.sessionError = null
        state.sessionChecked = true
        state.sessionUnavailable = false
        if (action.payload.stale) return
        state.user = action.payload.user
        state.isAuthenticated = Boolean(action.payload.user)
        state.sessionChecked = true
        state.sessionUnavailable = false
      })
      .addCase(hydrateCurrentUser.rejected, (state, action) => {
        // Server unreachable: we don't know yet. App.jsx retries on its own;
        // protected pages show what failed instead of sending someone who is
        // signed in to the login page.
        state.sessionStatus = 'idle'
        state.sessionUnavailable = true
        state.sessionError = action.payload || null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { logout, clearAuthError, clearPendingVerification } = authSlice.actions
export default authSlice.reducer
