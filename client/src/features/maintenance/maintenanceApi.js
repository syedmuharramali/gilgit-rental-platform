import { baseApi } from '../api/baseApi'

export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMaintenance: builder.query({
      query: () => '/maintenance/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Maintenance', id: 'MINE' }],
    }),
    getReceivedMaintenance: builder.query({
      query: (params = {}) => ({ url: '/maintenance/received', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Maintenance', id: 'RECEIVED' }],
    }),
    createMaintenance: builder.mutation({
      query: ({ tenancyId, ...body }) => ({ url: `/maintenance/tenancy/${tenancyId}`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Maintenance', id: 'MINE' }, { type: 'Maintenance', id: 'RECEIVED' }],
    }),
    updateMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/maintenance/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Maintenance', id: 'MINE' }, { type: 'Maintenance', id: 'RECEIVED' }],
    }),
    cancelMaintenance: builder.mutation({
      query: (id) => ({ url: `/maintenance/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Maintenance', id: 'MINE' }, { type: 'Maintenance', id: 'RECEIVED' }],
    }),
  }),
})

export const {
  useGetMyMaintenanceQuery,
  useGetReceivedMaintenanceQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useCancelMaintenanceMutation,
} = maintenanceApi
