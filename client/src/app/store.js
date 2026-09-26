import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer, { googleSignIn, loginUser, logoutUser, signedOut, verifyEmailToken } from '../features/auth/authSlice'
import { baseApi } from '../features/api/baseApi'
import { configureSessionHooks } from '../services/api'

const listenerMiddleware = createListenerMiddleware()

// Whenever the signed-in person changes, drop every cached query so nobody
// briefly sees the previous person's data.
listenerMiddleware.startListening({
  matcher: isAnyOf(signedOut, loginUser.fulfilled, googleSignIn.fulfilled, verifyEmailToken.fulfilled),
  effect: (_action, listenerApi) => {
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

// Makes refetchOnFocus / refetchOnReconnect (set in baseApi) actually work.
setupListeners(store.dispatch)

// The HTTP client can't import the store, so the store tells it how to react.
configureSessionHooks({
  // 401, or 403 ACCOUNT_INACTIVE, from any request.
  onSessionEnded: () => {
    if (store.getState().auth.isAuthenticated) store.dispatch(logoutUser())
  },
  getCurrentUserId: () => store.getState().auth.user?.id ?? null,
})
