import { baseApi } from '../api/baseApi'

export const favoritesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFavorites: builder.query({
      query: () => '/favorites',
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result?.favorites
          ? [
              ...result.favorites.map((favorite) => ({
                type: 'Favorite',
                id: favorite.property?._id || favorite._id,
              })),
              { type: 'Favorite', id: 'LIST' },
            ]
          : [{ type: 'Favorite', id: 'LIST' }],
    }),

    addFavorite: builder.mutation({
      query: (propertyId) => ({
        url: `/favorites/${propertyId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, propertyId) => [
        { type: 'Favorite', id: propertyId },
        { type: 'Favorite', id: 'LIST' },
      ],
    }),

    removeFavorite: builder.mutation({
      query: (propertyId) => ({
        url: `/favorites/${propertyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, propertyId) => [
        { type: 'Favorite', id: propertyId },
        { type: 'Favorite', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi
