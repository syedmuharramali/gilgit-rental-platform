import { baseApi } from '../api/baseApi'

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query({
      query: (params = {}) => ({ url: '/properties', params }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result?.properties
          ? [...result.properties.map((property) => ({ type: 'Property', id: property._id })), { type: 'Property', id: 'LIST' }]
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
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }, { type: 'Property', id: 'MINE' }],
    }),
    deleteProperty: builder.mutation({
      query: (id) => ({ url: `/properties/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Property', id: 'MINE' }, { type: 'Property', id: 'LIST' }],
    }),
    submitProperty: builder.mutation({
      query: (id) => ({ url: `/properties/${id}/submit`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Property', id }, { type: 'Property', id: 'MINE' }],
    }),
    uploadPropertyImages: builder.mutation({
      query: ({ id, files }) => {
        const body = new FormData()
        files.forEach((file) => body.append('images', file))
        return { url: `/properties/${id}/images`, method: 'POST', body }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }, { type: 'Property', id: 'MINE' }],
    }),
    setCoverImage: builder.mutation({
      query: ({ id, imageId }) => ({ url: `/properties/${id}/images/${imageId}/cover`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }, { type: 'Property', id: 'MINE' }],
    }),
    deletePropertyImage: builder.mutation({
      query: ({ id, imageId }) => ({ url: `/properties/${id}/images/${imageId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Property', id }, { type: 'Property', id: 'MINE' }],
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
  useSetCoverImageMutation,
  useDeletePropertyImageMutation,
} = propertiesApi
