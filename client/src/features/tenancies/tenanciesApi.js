import { baseApi } from '../api/baseApi'

export const tenanciesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyTenancies: builder.query({
      query: () => '/tenancies/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Tenancy', id: 'MINE' }],
    }),
    getOwnedTenancies: builder.query({
      query: () => '/tenancies/owned',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Tenancy', id: 'OWNED' }],
    }),
    getTenancy: builder.query({
      query: (id) => `/tenancies/${id}`,
      transformResponse: (response) => response.data.tenancy,
      providesTags: (_result, _error, id) => [{ type: 'Tenancy', id }],
    }),
    createTenancy: builder.mutation({
      query: ({ applicationId, ...body }) => ({
        url: `/tenancies/from-application/${applicationId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Tenancy', id: 'OWNED' },
        { type: 'Tenancy', id: 'MINE' },
        { type: 'Application', id: 'RECEIVED' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    endTenancy: builder.mutation({
      query: ({ id, reason }) => ({ url: `/tenancies/${id}/end`, method: 'PATCH', body: { reason } }),
      invalidatesTags: [
        { type: 'Tenancy', id: 'OWNED' },
        { type: 'Tenancy', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetMyTenanciesQuery,
  useGetOwnedTenanciesQuery,
  useGetTenancyQuery,
  useCreateTenancyMutation,
  useEndTenancyMutation,
} = tenanciesApi
