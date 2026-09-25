import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logoutUser } from '../auth/authSlice'
import { isCsrfError, isSessionEndedError } from '../../services/api'
import { CSRF_HEADER, getCsrfToken, setCsrfToken } from '../../services/session'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // The session is an httpOnly cookie; the browser attaches it.
  credentials: 'include',
  prepareHeaders: (headers) => {
    const csrfToken = getCsrfToken()

    if (csrfToken) {
      headers.set(CSRF_HEADER, csrfToken)
    }

    return headers
  },
})

const baseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  // Stale CSRF token (e.g. signed in again in another tab): refresh it from
  // the current cookie and retry once.
  if (isCsrfError(result.error?.status, result.error?.data?.code)) {
    const session = await rawBaseQuery('/auth/session', api, extraOptions)

    // Only act on a real answer; a failed check (offline, rate limit, 5xx)
    // must not sign anyone out.
    if (session.data) {
      const sessionUser = session.data.data?.user
      const currentUser = api.getState().auth?.user

      if (!sessionUser) {
        if (api.getState().auth?.isAuthenticated) api.dispatch(logoutUser())
      } else if (String(sessionUser.id) !== String(currentUser?.id)) {
        // Another tab signed in as someone else: never replay this request
        // as them. Reload so the page shows who is really signed in.
        window.location.reload()
      } else {
        setCsrfToken(session.data.data.csrfToken)
        result = await rawBaseQuery(args, api, extraOptions)
      }
    }
  }


  if (isSessionEndedError(result.error?.status, result.error?.data?.code) && api.getState().auth?.isAuthenticated) {
    api.dispatch(logoutUser())
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
    'RentalTerms',
    'Viewing',
    'Tenancy',
    'Message',
    'Agreement',
    'Review',
    'Report',
    'Notification',
    'Verification',
    'Booking',
  ],
  endpoints: () => ({}),
})
