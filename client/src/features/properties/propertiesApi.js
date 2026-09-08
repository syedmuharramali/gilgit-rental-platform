import api from '../../services/api'
import { baseApi } from '../api/baseApi'

const toUploadError = (error) => ({
  status: error.response?.status || 'CUSTOM_ERROR',
  data: error.response?.data || { message: error.message || 'Upload failed' },
  error: error.message || 'Upload failed',
})

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query({
      query: (params = {}) => ({ url: '/properties', params }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result?.properties
          ? [
              ...result.properties.map((property) => ({ type: 'Property', id: property._id })),
              { type: 'Property', id: 'LIST' },
            ]
          : [{ type: 'Property', id: 'LIST' }],
    }),
    getProperty: builder.query({
      query: (id) => `/properties/${id}`,
      transformResponse: (response) => response.data.property,
      providesTags: (_result, _error, id) => [{ type: 'Property', id }],
    }),
    getMyProperties: builder.query({
      query: () => '/properties/mine',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Property', id: 'MINE' }],
    }),
    createProperty: builder.mutation({
      query: (body) => ({ url: '/properties', method: 'POST', body }),
      invalidatesTags: [{ type: 'Property', id: 'MINE' }],
    }),
    updateProperty: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/properties/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    deleteProperty: builder.mutation({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Property', id: 'MINE' }, { type: 'Property', id: 'LIST' }],
    }),
    submitProperty: builder.mutation({
      query: (id) => ({ url: `/properties/${id}/submit`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    uploadPropertyImages: builder.mutation({
      async queryFn({ id, files, onProgress }) {
        const body = new FormData()
        files.forEach((file) => body.append('images', file))

        try {
          const response = await api.post(`/properties/${id}/images`, body, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 0,
            onUploadProgress: (event) => {
              const total = event.total || files.reduce((sum, file) => sum + file.size, 0)
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    reorderPropertyImages: builder.mutation({
      query: ({ id, imageIds }) => ({
        url: `/properties/${id}/images/reorder`,
        method: 'PATCH',
        body: { imageIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    setCoverImage: builder.mutation({
      query: ({ id, imageId }) => ({ url: `/properties/${id}/images/${imageId}/cover`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    deletePropertyImage: builder.mutation({
      query: ({ id, imageId }) => ({ url: `/properties/${id}/images/${imageId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Property', id },
        { type: 'Property', id: 'MINE' },
        { type: 'Property', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetMyPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useSubmitPropertyMutation,
  useUploadPropertyImagesMutation,
  useReorderPropertyImagesMutation,
  useSetCoverImageMutation,
  useDeletePropertyImageMutation,
} = propertiesApi
