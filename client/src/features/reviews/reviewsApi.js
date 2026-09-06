import { baseApi } from '../api/baseApi'

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPropertyReviews: builder.query({
      query: (propertyId) => `/reviews/property/${propertyId}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, propertyId) => [{ type: 'Review', id: `PROPERTY-${propertyId}` }],
    }),
    getMyReviews: builder.query({
      query: () => '/reviews/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Review', id: 'MINE' }],
    }),
    getReceivedReviews: builder.query({
      query: () => '/reviews/received',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Review', id: 'RECEIVED' }],
    }),
    createReview: builder.mutation({
      query: ({ tenancyId, rating, comment }) => ({
        url: `/reviews/tenancy/${tenancyId}`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: [{ type: 'Review', id: 'MINE' }, { type: 'Review', id: 'RECEIVED' }],
    }),
  }),
})

export const {
  useGetPropertyReviewsQuery,
  useGetMyReviewsQuery,
  useGetReceivedReviewsQuery,
  useCreateReviewMutation,
} = reviewsApi
