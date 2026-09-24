import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer, { googleSignIn, loginUser, logout, verifyEmailToken } from '../features/auth/authSlice'
import { baseApi } from '../features/api/baseApi'
import { setSessionEndedHandler } from '../services/api'

const listenerMiddleware = createListenerMiddleware()

// Drop every cached query whenever the signed-in person changes — not only
// on logout. Opening someone else's confirmation link, or signing in over a
// stale tab, otherwise briefly showed the previous person's data.
listenerMiddleware.startListening({
  matcher: isAnyOf(logout, loginUser.fulfilled, googleSignIn.fulfilled, verifyEmailToken.fulfilled),
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
})

// Without this, the refetchOnFocus / refetchOnReconnect options set on the
// API did nothing: coming back to a tab never refreshed it.
setupListeners(store.dispatch)

setSessionEndedHandler(() => {
  if (store.getState().auth.token) store.dispatch(logout())
})
