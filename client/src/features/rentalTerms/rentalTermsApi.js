import { baseApi } from '../api/baseApi'

export const rentalTermsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyRentalTerms: builder.query({
      query: () => '/rental-terms',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'RentalTerms', id: 'LIST' }],
    }),
    proposeRentalTerms: builder.mutation({
      query: ({ applicationId, ...body }) => ({
        url: `/rental-terms/application/${applicationId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'RentalTerms', id: 'LIST' },
        { type: 'Application', id: 'MINE' },
        { type: 'Application', id: 'RECEIVED' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    acceptRentalTerms: builder.mutation({
      query: (id) => ({
        url: `/rental-terms/${id}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'RentalTerms', id: 'LIST' },
        { type: 'Application', id: 'MINE' },
        { type: 'Application', id: 'RECEIVED' },
      ],
    }),
    requestRentalTermChanges: builder.mutation({
      query: ({ id, message }) => ({
        url: `/rental-terms/${id}/request-changes`,
        method: 'PATCH',
        body: { message },
      }),
      invalidatesTags: [
        { type: 'RentalTerms', id: 'LIST' },
        { type: 'Application', id: 'MINE' },
        { type: 'Application', id: 'RECEIVED' },
      ],
    }),
  }),
})

export const {
  useGetMyRentalTermsQuery,
  useProposeRentalTermsMutation,
  useAcceptRentalTermsMutation,
  useRequestRentalTermChangesMutation,
} = rentalTermsApi
