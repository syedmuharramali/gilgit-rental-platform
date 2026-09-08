import api from '../../services/api'
import { baseApi } from '../api/baseApi'

const toUploadError = (error) => ({
  status: error.response?.status || 'CUSTOM_ERROR',
  data: error.response?.data || { message: error.message || 'Upload failed' },
  error: error.message || 'Upload failed',
})

export const verificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyVerification: builder.query({
      query: () => '/owner-verification/me',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Verification', id: 'ME' }],
    }),
    submitVerification: builder.mutation({
      async queryFn({ cnicLast4, cnicFront, cnicBack, selfie, onProgress }) {
        const body = new FormData()
        body.append('cnicLast4', cnicLast4)
        body.append('cnicFront', cnicFront)
        body.append('cnicBack', cnicBack)
        body.append('selfie', selfie)

        try {
          const response = await api.post('/owner-verification', body, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 0,
            onUploadProgress: (event) => {
              const fallbackTotal = [cnicFront, cnicBack, selfie].reduce((sum, file) => sum + (file?.size || 0), 0)
              const total = event.total || fallbackTotal
              const loaded = Math.min(event.loaded || 0, total || event.loaded || 0)
              const percent = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0
              onProgress?.({ loaded, total, percent })
            },
          })

          return { data: response.data }
        } catch (error) {
          return { error: toUploadError(error) }
        }
      },
      invalidatesTags: [{ type: 'Verification', id: 'ME' }],
    }),
  }),
})

export const {
  useGetMyVerificationQuery,
  useSubmitVerificationMutation,
} = verificationApi
