import { baseApi } from '../api/baseApi'

export const amenitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAmenities: builder.query({
      query: () => '/amenities',
      transformResponse: (response) => response.data,
    }),
  }),
})

export const { useGetAmenitiesQuery } = amenitiesApi
