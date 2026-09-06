import { baseApi } from '../api/baseApi'

export const conditionReportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConditionReports: builder.query({
      query: (tenancyId) => `/condition-reports/tenancy/${tenancyId}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, tenancyId) => [
        { type: 'ConditionReport', id: `TENANCY-${tenancyId}` },
        { type: 'ConditionReport', id: 'LIST' },
      ],
    }),
    createConditionReport: builder.mutation({
      query: ({ tenancyId, ...body }) => ({ url: `/condition-reports/tenancy/${tenancyId}`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { tenancyId }) => [
        { type: 'ConditionReport', id: `TENANCY-${tenancyId}` },
        { type: 'ConditionReport', id: 'LIST' },
      ],
    }),
    confirmConditionReport: builder.mutation({
      query: (id) => ({ url: `/condition-reports/${id}/confirm`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'ConditionReport', id: 'LIST' }],
    }),
    uploadConditionEvidence: builder.mutation({
      query: ({ id, files }) => {
        const body = new FormData()
        files.forEach((file) => body.append('images', file))
        return { url: `/condition-reports/${id}/evidence`, method: 'POST', body }
      },
      invalidatesTags: [{ type: 'ConditionReport', id: 'LIST' }],
    }),
    getConditionEvidence: builder.query({
      query: ({ id, evidenceId }) => ({
        url: `/condition-reports/${id}/evidence/${evidenceId}`,
        responseHandler: (response) => response.blob(),
      }),
      keepUnusedDataFor: 0,
    }),
  }),
})

export const {
  useGetConditionReportsQuery,
  useCreateConditionReportMutation,
  useConfirmConditionReportMutation,
  useUploadConditionEvidenceMutation,
  useLazyGetConditionEvidenceQuery,
} = conditionReportsApi
