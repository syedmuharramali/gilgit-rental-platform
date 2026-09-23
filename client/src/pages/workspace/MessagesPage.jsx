import { ArrowLeft, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '../../features/messages/messagesApi'
import { EmptyState, LoadingState, PageHeader, PrimaryButton, TextInput, dateTime } from '../../components/workspace/WorkspaceUI'

function MessagesPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const { data, isLoading } = useGetConversationsQuery(undefined, { pollingInterval: 15000 })
  const conversations = data?.conversations || []
  const [selected, setSelected] = useState(location.state?.conversationId || null)
  const [mobileConversationOpen, setMobileConversationOpen] = useState(Boolean(location.state?.conversationId))
  const active = selected || conversations[0]?._id || null
  const activeConversation = conversations.find((conversation) => conversation._id === active)
  const { data: messageData } = useGetConversationMessagesQuery(
    { conversationId: active, page: 1, limit: 100 },
    { skip: !active, pollingInterval: 8000 },
  )
  const [sendMessage, sendState] = useSendMessageMutation()
  const [markRead] = useMarkConversationReadMutation()
  const [body, setBody] = useState('')
  const scrollRef = useRef(null)

  const ownerId = activeConversation?.owner?._id || activeConversation?.owner?.id
  const other = ownerId === user?.id ? activeConversation?.renter : activeConversation?.owner

  useEffect(() => {
    if (location.state?.conversationId) {
      setSelected(location.state.conversationId)
      setMobileConversationOpen(true)
    }
  }, [location.state?.conversationId])

  useEffect(() => {
    if (active) markRead(active).catch(() => {})
  }, [active, markRead])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [active, messageData?.messages?.length])

  const openConversation = (conversationId) => {
    setSelected(conversationId)
    setMobileConversationOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!body.trim() || !active) return
    try {
      await sendMessage({ conversationId: active, body }).unwrap()
      setBody('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <>
      <PageHeader eyebrow={t('msg.eyebrow')} title={t('msg.title')} text={t('msg.text')} />

      <div className="min-h-[620px] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0d1423] shadow-[0_30px_90px_rgba(0,0,0,.25)] lg:grid lg:grid-cols-[330px_1fr]">
        <aside className={`${mobileConversationOpen ? 'hidden' : 'block'} border-white/[0.07] bg-[#0a101c] lg:block lg:border-r`}>
          <div className="border-b border-white/[0.06] p-4">
            <p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">{t('msg.conversations')}</p>
            <p className="mt-1 text-xs text-slate-600">{t('msg.count', { count: conversations.length })}</p>
          </div>

          {conversations.length ? conversations.map((conversation) => {
            const conversationOwnerId = conversation.owner?._id || conversation.owner?.id
            const conversationOther = conversationOwnerId === user?.id ? conversation.renter : conversation.owner
            return (
              <button
                key={conversation._id}
                type="button"
                onClick={() => openConversation(conversation._id)}
                className={`flex w-full gap-3 border-b border-white/[0.05] p-4 text-left transition ${active === conversation._id ? 'bg-cyan-300/[0.07]' : 'hover:bg-white/[0.035]'}`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-100 ring-1 ring-white/10">
                  {conversationOther?.avatar?.url ? <img src={conversationOther.avatar.url} alt="" className="h-full w-full object-cover" /> : conversationOther?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black text-white">{conversationOther?.name || t('msg.conversation')}</p>
                    {conversation.unreadCount > 0 && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] font-black text-[#07101e]">{conversation.unreadCount}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate-500">{conversation.property?.title || t('msg.property')}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{conversation.lastMessage?.body || t('msg.startConversation')}</p>
                </div>
              </button>
            )
          }) : <div className="p-5"><EmptyState title={t('msg.noConversations')} text={t('msg.noConversationsText')} /></div>}
        </aside>

        <section className={`${mobileConversationOpen ? 'flex' : 'hidden'} min-h-[620px] flex-col bg-[radial-gradient(circle_at_60%_0%,rgba(56,189,248,.05),transparent_32%),#0b111e] lg:flex`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-white/[0.07] bg-[#0a101c] p-4">
                <button type="button" onClick={() => setMobileConversationOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-300 lg:hidden" aria-label={t('msg.backToConversations')}><ArrowLeft className="h-4 w-4" /></button>
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-100 ring-1 ring-white/10">
                  {other?.avatar?.url ? <img src={other.avatar.url} alt="" className="h-full w-full object-cover" /> : other?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{other?.name || t('msg.conversation')}</p>
                  <p className="truncate text-xs text-slate-500">{activeConversation?.property?.title || t('msg.rentalProperty')}</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
                {(messageData?.messages || []).length ? (messageData?.messages || []).map((message) => {
                  const senderId = message.sender?._id || message.sender?.id
                  const mine = senderId === user?.id
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${mine ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-[#07101e]' : 'border border-white/[0.07] bg-white/[0.045] text-slate-200 shadow-sm'}`}>
                        {message.body}
                        <p className={`mt-1 text-[9px] ${mine ? 'text-[#07101e]/55' : 'text-slate-500'}`}>{dateTime(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                }) : <EmptyState title={t('msg.noMessages')} text={t('msg.noMessagesText')} />}
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-white/[0.07] bg-[#0a101c] p-4">
                <TextInput value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} placeholder={t('msg.writeMessage')} />
                <PrimaryButton disabled={sendState.isLoading || !body.trim()} aria-label={t('msg.send')}><Send className="h-4 w-4" /></PrimaryButton>
              </form>
            </>
          ) : <div className="grid min-h-[620px] place-items-center p-5"><EmptyState title={t('msg.chooseConversation')} text={null} /></div>}
        </section>
      </div>
    </>
  )
}

export default MessagesPage
