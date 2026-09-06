import { baseApi } from '../api/baseApi'

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyApplications: builder.query({
      query: () => '/applications/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Application', id: 'MINE' }],
    }),
    getReceivedApplications: builder.query({
      query: (params = {}) => ({ url: '/applications/received', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Application', id: 'RECEIVED' }],
    }),
    getPropertyApplications: builder.query({
      query: (propertyId) => `/applications/property/${propertyId}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, propertyId) => [{ type: 'Application', id: `PROPERTY-${propertyId}` }],
    }),
    createApplication: builder.mutation({
      query: ({ propertyId, ...body }) => ({ url: `/applications/${propertyId}`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Application', id: 'MINE' }],
    }),
    withdrawApplication: builder.mutation({
      query: (id) => ({ url: `/applications/${id}/withdraw`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Application', id: 'MINE' }, { type: 'Application', id: 'RECEIVED' }],
    }),
    acceptApplication: builder.mutation({
      query: (id) => ({ url: `/applications/${id}/accept`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Application', id: 'RECEIVED' }, { type: 'Application', id: 'MINE' }],
    }),
    rejectApplication: builder.mutation({
      query: ({ id, reason }) => ({ url: `/applications/${id}/reject`, method: 'PATCH', body: { reason } }),
      invalidatesTags: [{ type: 'Application', id: 'RECEIVED' }, { type: 'Application', id: 'MINE' }],
    }),
  }),
})

export const {
  useGetMyApplicationsQuery,
  useGetReceivedApplicationsQuery,
  useGetPropertyApplicationsQuery,
  useCreateApplicationMutation,
  useWithdrawApplicationMutation,
  useAcceptApplicationMutation,
  useRejectApplicationMutation,
} = applicationsApi
