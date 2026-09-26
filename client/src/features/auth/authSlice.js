import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, { errorMessageFor, setCsrfToken } from '../../services/api'

/*
 * Auth state
 *
 * The sign-in token is an httpOnly cookie the page never sees. What the page
 * keeps is who is signed in (here) and the CSRF token (in services/api.js,
 * memory only). Every sign-in response is { csrfToken, user }.
 *
 * Flows
 *   page load        -> checkSession()     GET  /auth/session
 *   email + password -> loginUser()        POST /auth/login
 *   Google           -> googleSignIn()     POST /auth/google
 *   confirm email    -> verifyEmailToken() POST /auth/verify-email
 *   sign up          -> registerUser()     POST /auth/register  (does NOT sign in)
 *   sign out         -> logoutUser()       POST /auth/logout
 */

const signIn = async (path, body) => {
  const { data } = await api.post(path, body)
  setCsrfToken(data.data.csrfToken)
  return data.data // { csrfToken, user }
}

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    return await signIn('/auth/login', credentials)
  } catch (error) {
    return rejectWithValue({
      message: errorMessageFor(error),
      code: error.response?.data?.code || null, // EMAIL_NOT_VERIFIED shows the resend box
      email: credentials?.email || null,
    })
  }
})

export const googleSignIn = createAsyncThunk('auth/googleSignIn', async (credential, { rejectWithValue }) => {
  try {
    return await signIn('/auth/google', { credential })
  } catch (error) {
    return rejectWithValue(errorMessageFor(error))
  }
})

export const verifyEmailToken = createAsyncThunk('auth/verifyEmailToken', async (token, { rejectWithValue }) => {
  try {
    return await signIn('/auth/verify-email', { token })
  } catch (error) {
    return rejectWithValue(errorMessageFor(error))
  }
})

// Creates the account and emails a confirmation link; the person signs in
// only after opening it.
export const registerUser = createAsyncThunk('auth/registerUser', async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', form)
    return { email: data.data?.email || form.email, emailSent: data.data?.emailSent !== false }
  } catch (error) {
    return rejectWithValue(errorMessageFor(error))
  }
})

export const resendVerificationEmail = createAsyncThunk('auth/resendVerificationEmail', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/resend-verification', { email })
    return data.message
  } catch (error) {
    return rejectWithValue(errorMessageFor(error))
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (changes, { rejectWithValue }) => {
  try {
    const { data } = await api.patch('/auth/me', changes)
    return data.data.user
  } catch (error) {
    return rejectWithValue(errorMessageFor(error))
  }
})

/*
 * Page load: who (if anyone) does the cookie belong to? Resolves with the
 * user or null. Rejects only if the server couldn't be reached, so a server
 * that is still starting isn't mistaken for "signed out"; App.jsx retries.
 */
export const checkSession = createAsyncThunk('auth/checkSession', async (_, { getState, rejectWithValue }) => {
  const epochAtStart = getState().auth.sessionEpoch

  try {
    const { data } = await api.get('/auth/session')

    // Someone signed in or out while this was in flight: its answer is old.
    if (getState().auth.sessionEpoch !== epochAtStart) return { stale: true }

    setCsrfToken(data.data?.csrfToken)
    return { user: data.data?.user || null }
  } catch (error) {
    const { baseURL = '', url = '' } = error.config || {}
    return rejectWithValue({
      message: errorMessageFor(error),
      status: error.response?.status ?? null,
      url: `${baseURL}${url}`, // shown on screen: tells a wrong API URL from a server error
    })
  }
})

// Clear the page first (so nothing bounces back to the dashboard), then ask
// the server to delete the httpOnly cookie. One retry for a flaky network.
export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  dispatch(signedOut())

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await api.post('/auth/logout')
      return
    } catch {
      // try once more; the cookie also expires on its own
    }
  }
})

const initialState = {
  user: null,
  isAuthenticated: false,

  // Sign-in / sign-up forms
  status: 'idle', // 'idle' | 'loading' | 'failed'
  error: null,
  pendingVerificationEmail: null, // account exists, email not confirmed yet

  // Page-load session check
  session: {
    checked: false, // we know whether someone is signed in
    checking: false,
    error: null, // set when the server couldn't be reached
  },

  // Bumped on every sign-in and sign-out, so an older checkSession() answer
  // can't overwrite a newer one.
  sessionEpoch: 0,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Local sign-out. Use logoutUser() to also clear the server cookie; this
    // alone is for when the server already says the session is over.
    signedOut(state) {
      setCsrfToken(null)
      state.user = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
      state.pendingVerificationEmail = null
      state.session = { checked: true, checking: false, error: null }
      state.sessionEpoch += 1
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const started = (state) => {
      state.status = 'loading'
      state.error = null
    }

    const signedIn = (state, action) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.status = 'idle'
      state.pendingVerificationEmail = null
      state.session = { checked: true, checking: false, error: null }
      state.sessionEpoch += 1
    }

    const failed = (state, action) => {
      const detailed = typeof action.payload === 'object' && action.payload
      state.status = 'failed'
      state.error = (detailed ? action.payload.message : action.payload) || action.error?.message || null

      if (detailed && action.payload.code === 'EMAIL_NOT_VERIFIED') {
        state.pendingVerificationEmail = action.payload.email
      }
    }

    for (const thunk of [loginUser, googleSignIn, verifyEmailToken]) {
      builder.addCase(thunk.pending, started).addCase(thunk.fulfilled, signedIn).addCase(thunk.rejected, failed)
    }

    builder
      .addCase(registerUser.pending, started)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'idle'
        state.pendingVerificationEmail = action.payload.email
      })
      .addCase(registerUser.rejected, failed)

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })

      // The session check has its own flags so it never greys out the forms.
      .addCase(checkSession.pending, (state) => {
        state.session.checking = true
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.session = { checked: true, checking: false, error: null }
        if (action.payload.stale) return
        state.user = action.payload.user
        state.isAuthenticated = Boolean(action.payload.user)
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.session.checking = false
        state.session.error = action.payload || { message: action.error?.message }
      })
  },
})

export const { signedOut, clearAuthError } = authSlice.actions
export default authSlice.reducer
