import { baseApi } from '../api/baseApi'

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query({
      query: (params = {}) => ({
        url: '/properties',
        params,
      }),
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
  }),
})

export const { useGetPropertiesQuery, useGetPropertyQuery } = propertiesApi
