import { baseApi } from '../api/baseApi'

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/admin/dashboard',
      transformResponse: (response) => response.data,
    }),
    getAdminProperties: builder.query({
      query: (params = {}) => ({ url: '/admin/properties', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Property', id: 'ADMIN_REVIEW' }],
    }),
    approveProperty: builder.mutation({
      query: (id) => ({ url: `/admin/properties/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Property', id: 'ADMIN_REVIEW' }, { type: 'Property', id: 'LIST' }],
    }),
    rejectProperty: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/properties/${id}/reject`, method: 'PATCH', body: { reason } }),
      invalidatesTags: [{ type: 'Property', id: 'ADMIN_REVIEW' }],
    }),
    getVerifications: builder.query({
      query: (params = {}) => ({ url: '/admin/verifications', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Verification', id: 'ADMIN' }],
    }),
    approveVerification: builder.mutation({
      query: (id) => ({ url: `/admin/verifications/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Verification', id: 'ADMIN' }, { type: 'Verification', id: 'ME' }],
    }),
    rejectVerification: builder.mutation({
      query: ({ id, reason, allowResubmission = true }) => ({
        url: `/admin/verifications/${id}/reject`,
        method: 'PATCH',
        body: { reason, allowResubmission },
      }),
      invalidatesTags: [{ type: 'Verification', id: 'ADMIN' }, { type: 'Verification', id: 'ME' }],
    }),
  }),
})

export const {
  useGetAdminDashboardQuery,
  useGetAdminPropertiesQuery,
  useApprovePropertyMutation,
  useRejectPropertyMutation,
  useGetVerificationsQuery,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
} = adminApi
