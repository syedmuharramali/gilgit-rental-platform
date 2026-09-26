import { createApi } from '@reduxjs/toolkit/query/react'
import api, { toRequestError } from '../../services/api'

/*
 * RTK Query runs every request through the shared axios client, so cookies,
 * the CSRF header and "session ended" handling are the same everywhere.
 *
 * Endpoints use the usual shape: '/path' or { url, method, body, params },
 * plus `responseType: 'blob'` and `timeout: 0` for file downloads.
 */
const axiosBaseQuery = async (args, { signal }) => {
  const { url, method = 'GET', body, params, responseType, timeout } = typeof args === 'string' ? { url: args } : args

  try {
    const response = await api.request({ url, method, data: body, params, responseType, timeout, signal })

    // The API always answers JSON. A plain string means the request hit
    // something else (e.g. VITE_API_URL pointing at the website): report it
    // instead of rendering empty pages.
    if (!responseType && typeof response.data === 'string') {
      return { error: { status: 'PARSING_ERROR', error: `Unexpected response from ${response.config?.baseURL || ''}${url}` } }
    }

    return { data: response.data }
  } catch (error) {
    return { error: toRequestError(error) }
  }
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
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
