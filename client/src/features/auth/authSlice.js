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
      return rejectWithValue(getErrorMessage(error, 'Unable to sign in'))
    }
  },
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload)
      persistSession(data.data)
      return data.data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to create account'))
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

const initialState = {
  token: localStorage.getItem(TOKEN_KEY),
  user: readStoredUser(),
  status: 'idle',
  sessionChecked: false,
  error: null,
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
    },
    clearAuthError(state) {
      state.error = null
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
      state.status = 'failed'
      state.error = action.payload || 'Authentication failed'
      state.sessionChecked = true
    }

    builder
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, fulfilled)
      .addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, fulfilled)
      .addCase(registerUser.rejected, rejected)
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
  },
})

export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
