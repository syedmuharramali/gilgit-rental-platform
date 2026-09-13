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
  }),
})

export const {
  useGetMyTenanciesQuery,
  useGetOwnedTenanciesQuery,
} = tenanciesApi
