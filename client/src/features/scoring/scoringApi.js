import { baseApi } from '../api/baseApi'

export const scoringApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLivingScore: builder.query({
      query: (propertyId) => `/scoring/properties/${propertyId}/living-score`,
      transformResponse: (response) => response.data,
    }),
    getPreferences: builder.query({
      query: () => '/scoring/preferences',
      transformResponse: (response) => response.data.preferences,
      providesTags: [{ type: 'Property', id: 'PREFERENCES' }],
    }),
    savePreferences: builder.mutation({
      query: (body) => ({
        url: '/scoring/preferences',
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => response.data.preferences,
      invalidatesTags: [{ type: 'Property', id: 'PREFERENCES' }],
    }),
    getMatches: builder.query({
      query: (limit = 20) => ({
        url: '/scoring/matches',
        params: { limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Property', id: 'MATCHES' }],
    }),
  }),
})

export const {
  useGetLivingScoreQuery,
  useGetPreferencesQuery,
  useSavePreferencesMutation,
  useGetMatchesQuery,
} = scoringApi
