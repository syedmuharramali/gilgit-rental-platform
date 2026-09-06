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
    getAdminProperty: builder.query({
      query: (id) => `/admin/properties/${id}`,
      transformResponse: (response) => response.data.property,
      providesTags: (_result, _error, id) => [{ type: 'Property', id: `ADMIN-${id}` }],
    }),
    approveProperty: builder.mutation({
      query: (id) => ({ url: `/admin/properties/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Property', id: 'ADMIN_REVIEW' },
        { type: 'Property', id: `ADMIN-${id}` },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    rejectProperty: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/properties/${id}/reject`, method: 'PATCH', body: { reason } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id: 'ADMIN_REVIEW' },
        { type: 'Property', id: `ADMIN-${id}` },
      ],
    }),
    getVerifications: builder.query({
      query: (params = {}) => ({ url: '/admin/verifications', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Verification', id: 'ADMIN' }],
    }),
    getVerification: builder.query({
      query: (id) => `/admin/verifications/${id}`,
      transformResponse: (response) => response.data.verification,
      providesTags: (_result, _error, id) => [{ type: 'Verification', id: `ADMIN-${id}` }],
    }),
    getVerificationDocument: builder.query({
      query: ({ id, documentType }) => ({
        url: `/admin/verifications/${id}/documents/${documentType}`,
        responseHandler: (response) => response.blob(),
      }),
      keepUnusedDataFor: 0,
    }),
    approveVerification: builder.mutation({
      query: (id) => ({ url: `/admin/verifications/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Verification', id: 'ADMIN' },
        { type: 'Verification', id: `ADMIN-${id}` },
        { type: 'Verification', id: 'ME' },
      ],
    }),
    rejectVerification: builder.mutation({
      query: ({ id, reason, allowResubmission = true }) => ({
        url: `/admin/verifications/${id}/reject`,
        method: 'PATCH',
        body: { reason, allowResubmission },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Verification', id: 'ADMIN' },
        { type: 'Verification', id: `ADMIN-${id}` },
        { type: 'Verification', id: 'ME' },
      ],
    }),
  }),
})

export const {
  useGetAdminDashboardQuery,
  useGetAdminPropertiesQuery,
  useGetAdminPropertyQuery,
  useApprovePropertyMutation,
  useRejectPropertyMutation,
  useGetVerificationsQuery,
  useGetVerificationQuery,
  useLazyGetVerificationDocumentQuery,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
} = adminApi
