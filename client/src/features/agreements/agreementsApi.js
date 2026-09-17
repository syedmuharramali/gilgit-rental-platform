import { baseApi } from '../api/baseApi'

export const agreementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgreements: builder.query({
      query: () => '/agreements',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Agreement', id: 'LIST' }],
    }),
    getAgreement: builder.query({
      query: (id) => `/agreements/${id}`,
      transformResponse: (response) => response.data.agreement,
      providesTags: (_result, _error, id) => [{ type: 'Agreement', id }],
    }),
    createAgreementFromTerms: builder.mutation({
      query: ({ termsId, clauses }) => ({
        url: `/agreements/rental-terms/${termsId}`,
        method: 'POST',
        body: clauses ? { clauses } : {},
      }),
      invalidatesTags: [
        { type: 'Agreement', id: 'LIST' },
        { type: 'Tenancy', id: 'MINE' },
        { type: 'Tenancy', id: 'OWNED' },
      ],
    }),
    createAgreement: builder.mutation({
      query: ({ tenancyId, clauses }) => ({
        url: `/agreements/tenancy/${tenancyId}`,
        method: 'POST',
        body: clauses ? { clauses } : {},
      }),
      invalidatesTags: [{ type: 'Agreement', id: 'LIST' }],
    }),
    signAgreement: builder.mutation({
      query: ({ id, legalName }) => ({
        url: `/agreements/${id}/sign`,
        method: 'PATCH',
        body: { accepted: true, legalName },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Agreement', id },
        { type: 'Agreement', id: 'LIST' },
        { type: 'Tenancy', id: 'MINE' },
        { type: 'Tenancy', id: 'OWNED' },
        { type: 'Property', id: 'LIST' },
        { type: 'Property', id: 'MINE' },
      ],
    }),
  }),
})

export const {
  useGetAgreementsQuery,
  useGetAgreementQuery,
  useCreateAgreementFromTermsMutation,
  useCreateAgreementMutation,
  useSignAgreementMutation,
} = agreementsApi
