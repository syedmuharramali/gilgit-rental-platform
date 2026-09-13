import { ArrowRight, Bell, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../features/notifications/notificationsApi'
import {
  EmptyState,
  LoadingState,
  PageHeader,
  Panel,
  SecondaryButton,
  dateTime,
} from '../../components/workspace/WorkspaceUI'

const getResourceId = (notification) => {
  const resource = notification?.resourceId
  if (!resource) return null
  if (typeof resource === 'string') return resource
  return resource._id || resource.id || null
}

const getNotificationDestination = (notification, ownerMode) => {
  const base = ownerMode ? '/owner' : '/dashboard'
  const resourceId = getResourceId(notification)

  switch (notification?.resourceType) {
    case 'conversation':
      return {
        pathname: `${base}/messages`,
        state: resourceId ? { conversationId: resourceId } : undefined,
        label: 'Open conversation',
      }
    case 'application':
      return { pathname: `${base}/applications`, label: 'Open applications' }
    case 'viewing':
      return { pathname: `${base}/viewings`, label: 'Open viewings' }
    case 'tenancy':
      return { pathname: `${base}/agreements`, label: 'Open agreement' }
    case 'rent_record':
      return { pathname: `${base}/agreements`, label: 'Open agreement' }
    case 'agreement':
      return { pathname: `${base}/agreements`, label: 'Open agreement' }
    case 'condition_report':
      return { pathname: `${base}/agreements`, label: 'Open agreement' }
    case 'maintenance_request':
      return { pathname: `${base}/agreements`, label: 'Open agreement' }
    case 'report':
      return { pathname: `${base}/reports`, label: 'Open safety reports' }
    case 'review':
      return { pathname: `${base}/reviews`, label: 'Open reviews' }
    case 'property':
      if (ownerMode) return { pathname: '/owner/properties', label: 'Open properties' }
      return resourceId
        ? { pathname: `/properties/${resourceId}`, label: 'Open property' }
        : { pathname: '/properties', label: 'Browse properties' }
    default:
      return null
  }
}

function NotificationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const ownerMode = location.pathname.startsWith('/owner')
  const { data, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 20000 },
  )
  const [read] = useMarkNotificationReadMutation()
  const [readAll] = useMarkAllNotificationsReadMutation()
  const [remove] = useDeleteNotificationMutation()

  const openNotification = async (notification) => {
    const destination = getNotificationDestination(notification, ownerMode)

    if (!notification.isRead) {
      try {
        await read(notification._id).unwrap()
      } catch {
        // Navigation should still work if updating read state fails temporarily.
      }
    }

    if (destination) {
      navigate(destination.pathname, { state: destination.state })
    }
  }

  if (isLoading) return <LoadingState />
  const items = data?.notifications || []

  return (
    <>
      <PageHeader
        eyebrow="Activity centre"
        title="Notifications"
        text="Open an update to jump directly to the part of your rental journey that needs attention."
        action={items.some((notification) => !notification.isRead)
          ? <SecondaryButton onClick={() => readAll()}>Mark all read</SecondaryButton>
          : null}
      />

      <div className="space-y-3">
        {items.length ? items.map((notification, index) => {
          const destination = getNotificationDestination(notification, ownerMode)

          return (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.025 }}
            >
              <Panel className={`transition ${!notification.isRead ? 'border-cyan-300/20 bg-cyan-300/[0.035]' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${notification.isRead ? 'bg-white/[0.04] text-slate-500' : 'bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15'}`}>
                    <Bell className="h-4 w-4" />
                  </div>

                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`min-w-0 flex-1 text-left ${destination ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-label={destination ? `${notification.title}. ${destination.label}` : notification.title}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-white">{notification.title}</p>
                      {!notification.isRead && <span className="h-2 w-2 rounded-full bg-cyan-300" aria-label="Unread" />}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <p className="text-[10px] font-bold text-slate-500">{dateTime(notification.createdAt)}</p>
                      {destination && (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-300">
                          {destination.label} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {!destination && !notification.isRead && (
                        <span className="text-xs font-black text-cyan-300">Mark as read</span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(notification._id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300"
                    aria-label={`Delete notification: ${notification.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Panel>
            </motion.div>
          )
        }) : <EmptyState title="You're all caught up" text="New rental activity will appear here." />}
      </div>
    </>
  )
}

export default NotificationsPage
