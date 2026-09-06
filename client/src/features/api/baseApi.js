import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const TOKEN_KEY = 'gilgit_rental_token'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem(TOKEN_KEY)

      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }

      return headers
    },
  }),
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
    'Notification',
    'Verification',
  ],
  endpoints: () => ({}),
})
