import { baseApi } from '../api/baseApi'

export const verificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyVerification: builder.query({
      query: () => '/owner-verification/me',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Verification', id: 'ME' }],
    }),
    submitVerification: builder.mutation({
      query: ({ cnicLast4, cnicFront, cnicBack, selfie }) => {
        const body = new FormData()
        body.append('cnicLast4', cnicLast4)
        body.append('cnicFront', cnicFront)
        body.append('cnicBack', cnicBack)
        body.append('selfie', selfie)
        return { url: '/owner-verification', method: 'POST', body }
      },
      invalidatesTags: [{ type: 'Verification', id: 'ME' }],
    }),
  }),
})

export const {
  useGetMyVerificationQuery,
  useSubmitVerificationMutation,
} = verificationApi
