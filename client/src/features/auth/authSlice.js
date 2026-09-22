import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/api'

const TOKEN_KEY = 'gilgit_rental_token'
const USER_KEY = 'gilgit_rental_user'

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

const persistSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback

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

export const hydrateCurrentUser = createAsyncThunk(
  'auth/hydrateCurrentUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      return rejectWithValue('No active session')
    }

    try {
      const { data } = await api.get('/auth/me')
      const user = data.data.user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      return user
    } catch (error) {
      clearSession()
      return rejectWithValue(getErrorMessage(error, 'Session expired'))
    }
  },
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/auth/me', payload)
      const user = data.data.user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      return user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to update profile'))
    }
  },
)

const initialState = {
  token: localStorage.getItem(TOKEN_KEY),
  user: readStoredUser(),
  status: 'idle',
  sessionChecked: false,
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
      state.token = null
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
      state.token = action.payload.token
      state.user = action.payload.user
      state.sessionChecked = true
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
      .addCase(hydrateCurrentUser.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(hydrateCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.sessionChecked = true
      })
      .addCase(hydrateCurrentUser.rejected, (state) => {
        state.status = 'idle'
        state.token = null
        state.user = null
        state.sessionChecked = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { logout, clearAuthError, clearPendingVerification } = authSlice.actions
export default authSlice.reducer
