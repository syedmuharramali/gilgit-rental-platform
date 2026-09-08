import { baseApi } from '../api/baseApi'

export const messagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/messages/conversations',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Message', id: 'CONVERSATIONS' }],
    }),
    startConversation: builder.mutation({
      query: (propertyId) => ({ url: `/messages/conversations/${propertyId}`, method: 'POST' }),
      invalidatesTags: [{ type: 'Message', id: 'CONVERSATIONS' }],
    }),
    startApplicationConversation: builder.mutation({
      query: (applicationId) => ({ url: `/messages/conversations/application/${applicationId}`, method: 'POST' }),
      invalidatesTags: [{ type: 'Message', id: 'CONVERSATIONS' }],
    }),
    getConversationMessages: builder.query({
      query: ({ conversationId, page = 1, limit = 50 }) => ({
        url: `/messages/conversations/${conversationId}/messages`,
        params: { page, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, { conversationId }) => [{ type: 'Message', id: conversationId }],
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, body }) => ({
        url: `/messages/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Message', id: 'CONVERSATIONS' },
      ],
    }),
    markConversationRead: builder.mutation({
      query: (conversationId) => ({ url: `/messages/conversations/${conversationId}/read`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, conversationId) => [
        { type: 'Message', id: conversationId },
        { type: 'Message', id: 'CONVERSATIONS' },
      ],
    }),
  }),
})

export const {
  useGetConversationsQuery,
  useStartConversationMutation,
  useStartApplicationConversationMutation,
  useGetConversationMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} = messagesApi
