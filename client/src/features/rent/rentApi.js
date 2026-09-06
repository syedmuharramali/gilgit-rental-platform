import { baseApi } from '../api/baseApi'

export const rentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyRentRecords: builder.query({
      query: () => '/rent-ledger/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'RentRecord', id: 'MINE' }],
    }),
    getOwnedRentRecords: builder.query({
      query: (params = {}) => ({ url: '/rent-ledger/owned', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'RentRecord', id: 'OWNED' }],
    }),
    getTenancyRentRecords: builder.query({
      query: (tenancyId) => `/rent-ledger/tenancy/${tenancyId}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, tenancyId) => [{ type: 'RentRecord', id: `TENANCY-${tenancyId}` }],
    }),
    generateRentSchedule: builder.mutation({
      query: (tenancyId) => ({ url: `/rent-ledger/tenancy/${tenancyId}/generate`, method: 'POST' }),
      invalidatesTags: [{ type: 'RentRecord', id: 'OWNED' }, { type: 'RentRecord', id: 'MINE' }],
    }),
    recordPayment: builder.mutation({
      query: ({ id, amount, notes }) => ({ url: `/rent-ledger/${id}/payment`, method: 'PATCH', body: { amount, notes } }),
      invalidatesTags: [{ type: 'RentRecord', id: 'OWNED' }, { type: 'RentRecord', id: 'MINE' }],
    }),
  }),
})

export const {
  useGetMyRentRecordsQuery,
  useGetOwnedRentRecordsQuery,
  useGetTenancyRentRecordsQuery,
  useGenerateRentScheduleMutation,
  useRecordPaymentMutation,
} = rentApi
