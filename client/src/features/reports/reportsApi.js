import { baseApi } from '../api/baseApi'

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyReports: builder.query({
      query: () => '/reports/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Report', id: 'MINE' }],
    }),
    createReport: builder.mutation({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      invalidatesTags: [{ type: 'Report', id: 'MINE' }, { type: 'Report', id: 'ADMIN' }],
    }),
    getAdminReports: builder.query({
      query: (params = {}) => ({ url: '/reports/admin', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Report', id: 'ADMIN' }],
    }),
    updateAdminReport: builder.mutation({
      query: ({ id, status, adminNotes }) => ({
        url: `/reports/admin/${id}`,
        method: 'PATCH',
        body: { status, adminNotes },
      }),
      invalidatesTags: [{ type: 'Report', id: 'ADMIN' }, { type: 'Report', id: 'MINE' }],
    }),
  }),
})

export const {
  useGetMyReportsQuery,
  useCreateReportMutation,
  useGetAdminReportsQuery,
  useUpdateAdminReportMutation,
} = reportsApi
