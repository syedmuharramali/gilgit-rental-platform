import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from '../auth/authSlice'

const TOKEN_KEY = 'gilgit_rental_token'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }

    return headers
  },
})

const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
    api.dispatch(logout())
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Property',
    'Favorite',
    'Application',
    'Viewing',
    'Tenancy',
    'RentRecord',
    'Message',
    'Agreement',
    'ConditionReport',
    'Maintenance',
    'Review',
    'Report',
    'Notification',
    'Verification',
  ],
  endpoints: () => ({}),
})
