import { baseApi } from '../api/baseApi'

export const viewingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyViewings: builder.query({
      query: () => '/viewings/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Viewing', id: 'MINE' }],
    }),
    getReceivedViewings: builder.query({
      query: (params = {}) => ({ url: '/viewings/received', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Viewing', id: 'RECEIVED' }],
    }),
    getPropertyViewings: builder.query({
      query: (propertyId) => `/viewings/property/${propertyId}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, propertyId) => [{ type: 'Viewing', id: `PROPERTY-${propertyId}` }],
    }),
    createViewing: builder.mutation({
      query: ({ propertyId, ...body }) => ({ url: `/viewings/${propertyId}`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Viewing', id: 'MINE' }],
    }),
    cancelViewing: builder.mutation({
      query: (id) => ({ url: `/viewings/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Viewing', id: 'MINE' }, { type: 'Viewing', id: 'RECEIVED' }],
    }),
    confirmViewing: builder.mutation({
      query: ({ id, ownerResponse }) => ({ url: `/viewings/${id}/confirm`, method: 'PATCH', body: { ownerResponse } }),
      invalidatesTags: [{ type: 'Viewing', id: 'RECEIVED' }, { type: 'Viewing', id: 'MINE' }],
    }),
    rejectViewing: builder.mutation({
      query: ({ id, ownerResponse }) => ({ url: `/viewings/${id}/reject`, method: 'PATCH', body: { ownerResponse } }),
      invalidatesTags: [{ type: 'Viewing', id: 'RECEIVED' }, { type: 'Viewing', id: 'MINE' }],
    }),
    completeViewing: builder.mutation({
      query: (id) => ({ url: `/viewings/${id}/complete`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Viewing', id: 'RECEIVED' }, { type: 'Viewing', id: 'MINE' }],
    }),
  }),
})

export const {
  useGetMyViewingsQuery,
  useGetReceivedViewingsQuery,
  useGetPropertyViewingsQuery,
  useCreateViewingMutation,
  useCancelViewingMutation,
  useConfirmViewingMutation,
  useRejectViewingMutation,
  useCompleteViewingMutation,
} = viewingsApi
