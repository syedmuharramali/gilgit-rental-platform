import { FileCheck2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  useCancelViewingMutation,
  useCompleteViewingMutation,
  useConfirmViewingMutation,
  useGetMyViewingsQuery,
  useGetReceivedViewingsQuery,
  useRejectViewingMutation,
} from '../../features/viewings/viewingsApi'
import {
  EmptyState,
  LoadingState,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  dateTime,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

export function ViewingsPage({ owner = false }) {
  const myQuery = useGetMyViewingsQuery(undefined, { skip: owner })
  const receivedQuery = useGetReceivedViewingsQuery(undefined, { skip: !owner })
  const query = owner ? receivedQuery : myQuery
  const [confirm] = useConfirmViewingMutation()
  const [reject] = useRejectViewingMutation()
  const [complete] = useCompleteViewingMutation()
  const [cancel] = useCancelViewingMutation()

  const act = async (fn, payload, success) => {
    try {
      await fn(payload).unwrap()
      toast.success(success)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (query.isLoading) return <LoadingState />
  const items = query.data?.viewings || []

  return (
    <>
      <PageHeader eyebrow="Visits" title={owner ? 'Viewing requests' : 'Your viewings'} text="Schedule and track in-person property visits without losing the conversation context." />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((item, index) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Panel className="h-full">
              <div className="flex items-start justify-between gap-4"><div><StatusBadge value={item.status} /><h2 className="mt-3 font-black text-white">{item.property?.title}</h2><p className="mt-1 text-sm text-slate-400">{dateTime(item.requestedDateTime)}</p>{owner && <p className="mt-2 text-sm font-bold text-slate-200">{item.renter?.name}</p>}</div><div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><FileCheck2 className="h-5 w-5" /></div></div>
              {item.message && <p className="mt-4 text-sm leading-6 text-slate-300">{item.message}</p>}
              {item.ownerResponse && <p className="mt-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-sm text-slate-300">Owner response: {item.ownerResponse}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {owner && item.status === 'requested' && <><PrimaryButton onClick={() => act(confirm, { id: item._id, ownerResponse: 'Viewing confirmed. See you at the requested time.' }, 'Viewing confirmed')}>Confirm</PrimaryButton><SecondaryButton onClick={() => act(reject, { id: item._id, ownerResponse: 'Unable to host this viewing time.' }, 'Viewing rejected')}>Reject</SecondaryButton></>}
                {owner && item.status === 'confirmed' && <PrimaryButton onClick={() => act(complete, item._id, 'Viewing completed')}>Mark completed</PrimaryButton>}
                {!owner && ['requested', 'confirmed'].includes(item.status) && <SecondaryButton onClick={() => act(cancel, item._id, 'Viewing cancelled')}>Cancel</SecondaryButton>}
              </div>
            </Panel>
          </motion.div>
        )) : <EmptyState title="No viewings yet" />}
      </div>
    </>
  )
}
