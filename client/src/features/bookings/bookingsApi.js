import { baseApi } from '../api/baseApi'

// Every change to a booking can show up on both sides (guest's trips and
// the hotel's bookings), in availability, and in the stay's reviews.
const changed = [
  { type: 'Booking', id: 'MINE' },
  { type: 'Booking', id: 'RECEIVED' },
  { type: 'Booking', id: 'AVAILABILITY' },
]

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStayAvailability: builder.query({
      query: ({ propertyId, checkIn, checkOut }) => ({
        url: `/bookings/availability/${propertyId}`,
        params: { checkIn, checkOut },
      }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Booking', id: 'AVAILABILITY' }],
    }),
    getMyBookings: builder.query({
      query: (params = {}) => ({ url: '/bookings/mine', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Booking', id: 'MINE' }],
    }),
    getReceivedBookings: builder.query({
      query: (params = {}) => ({ url: '/bookings/received', params }),
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Booking', id: 'RECEIVED' }],
    }),
    createBooking: builder.mutation({
      query: ({ propertyId, ...body }) => ({ url: `/bookings/${propertyId}`, method: 'POST', body }),
      invalidatesTags: changed,
    }),
    confirmBooking: builder.mutation({
      query: ({ id, message }) => ({ url: `/bookings/${id}/confirm`, method: 'PATCH', body: { message } }),
      invalidatesTags: changed,
    }),
    declineBooking: builder.mutation({
      query: ({ id, message }) => ({ url: `/bookings/${id}/decline`, method: 'PATCH', body: { message } }),
      invalidatesTags: changed,
    }),
    cancelBooking: builder.mutation({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH', body: { reason } }),
      invalidatesTags: changed,
    }),
    reviewBooking: builder.mutation({
      query: ({ id, rating, comment }) => ({ url: `/bookings/${id}/review`, method: 'POST', body: { rating, comment } }),
      invalidatesTags: (_result, _error, { propertyId }) => [
        ...changed,
        { type: 'Review', id: 'MINE' },
        { type: 'Review', id: 'RECEIVED' },
        ...(propertyId ? [{ type: 'Review', id: `PROPERTY-${propertyId}` }] : []),
      ],
    }),
  }),
})

export const {
  useGetStayAvailabilityQuery,
  useGetMyBookingsQuery,
  useGetReceivedBookingsQuery,
  useCreateBookingMutation,
  useConfirmBookingMutation,
  useDeclineBookingMutation,
  useCancelBookingMutation,
  useReviewBookingMutation,
} = bookingsApi
