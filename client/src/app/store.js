import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import authReducer, { logout } from '../features/auth/authSlice'
import { baseApi } from '../features/api/baseApi'

const listenerMiddleware = createListenerMiddleware()

listenerMiddleware.startListening({
  actionCreator: logout,
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
