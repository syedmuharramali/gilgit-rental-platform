import { useMemo, useState } from 'react'
import { FileCheck2, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAcceptApplicationMutation,
  useGetMyApplicationsQuery,
  useGetReceivedApplicationsQuery,
  useRejectApplicationMutation,
  useWithdrawApplicationMutation,
} from '../../features/applications/applicationsApi'
import { useGetAgreementsQuery } from '../../features/agreements/agreementsApi'
import { useStartApplicationConversationMutation } from '../../features/messages/messagesApi'
import {
  useAcceptRentalTermsMutation,
  useGetMyRentalTermsQuery,
  useProposeRentalTermsMutation,
  useRequestRentalTermChangesMutation,
} from '../../features/rentalTerms/rentalTermsApi'
import {
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextArea,
  TextInput,
  money,
  pretty,
  shortDate,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

function ApplicationsPage({ owner = false }) {
  const navigate = useNavigate()
  const myQuery = useGetMyApplicationsQuery(undefined, { skip: owner })
  const receivedQuery = useGetReceivedApplicationsQuery(undefined, { skip: !owner })
  const query = owner ? receivedQuery : myQuery
  const { data: rentalTermsData, isLoading: termsLoading } = useGetMyRentalTermsQuery()
  const { data: agreementData, isLoading: agreementsLoading } = useGetAgreementsQuery()
  const [accept] = useAcceptApplicationMutation()
  const [reject] = useRejectApplicationMutation()
  const [withdraw] = useWithdrawApplicationMutation()
  const [startApplicationConversation, conversationState] = useStartApplicationConversationMutation()
  const [proposeRentalTerms, proposeState] = useProposeRentalTermsMutation()
  const [acceptRentalTerms, acceptTermsState] = useAcceptRentalTermsMutation()
  const [requestRentalTermChanges, requestChangesState] = useRequestRentalTermChangesMutation()
  const [termsApplication, setTermsApplication] = useState(null)
  const [termsForm, setTermsForm] = useState({ startDate: '', durationMonths: '', monthlyRent: '', securityDeposit: '', occupants: '1' })
  const [changeTerms, setChangeTerms] = useState(null)
  const [changeMessage, setChangeMessage] = useState('')

  const termsByApplication = useMemo(() => {
    const map = new Map()
    for (const terms of rentalTermsData?.terms || []) {
      const applicationId = terms.application?._id || terms.application
      if (applicationId) map.set(String(applicationId), terms)
    }
    return map
  }, [rentalTermsData])

  const agreementsByTerms = useMemo(() => {
    const map = new Map()
    for (const agreement of agreementData?.agreements || []) {
      const termsId = agreement.rentalTerms?._id || agreement.rentalTerms
      if (termsId) map.set(String(termsId), agreement)
    }
    return map
  }, [agreementData])

  const act = async (fn, payload, success) => {
    try { await fn(payload).unwrap(); toast.success(success) } catch (error) { toast.error(errorMessage(error)) }
  }

  const openConversation = async (application) => {
    try {
      const result = await startApplicationConversation(application._id).unwrap()
      const conversationId = result?.data?.conversation?._id || result?.conversation?._id
      if (!conversationId) return toast.error('Conversation could not be opened')
      navigate(owner ? '/owner/messages' : '/dashboard/messages', { state: { conversationId } })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openTerms = (application, existingTerms) => {
    setTermsApplication(application)
    setTermsForm({
      startDate: existingTerms?.startDate?.slice(0, 10) || application.preferredMoveInDate?.slice(0, 10) || '',
      durationMonths: existingTerms?.durationMonths != null ? String(existingTerms.durationMonths) : application.expectedStayMonths != null ? String(application.expectedStayMonths) : '',
      monthlyRent: existingTerms?.monthlyRent != null ? String(existingTerms.monthlyRent) : application.property?.monthlyRent != null ? String(application.property.monthlyRent) : '',
      securityDeposit: existingTerms?.securityDeposit != null ? String(existingTerms.securityDeposit) : '',
      occupants: existingTerms?.occupants != null ? String(existingTerms.occupants) : application.occupants != null ? String(application.occupants) : '1',
    })
  }

  const submitTerms = async () => {
    try {
      await proposeRentalTerms({
        applicationId: termsApplication._id,
        ...(termsForm.startDate && { startDate: termsForm.startDate }),
        ...(termsForm.durationMonths !== '' && { durationMonths: Number(termsForm.durationMonths) }),
        ...(termsForm.monthlyRent !== '' && { monthlyRent: Number(termsForm.monthlyRent) }),
        ...(termsForm.securityDeposit !== '' && { securityDeposit: Number(termsForm.securityDeposit) }),
        ...(termsForm.occupants !== '' && { occupants: Number(termsForm.occupants) }),
      }).unwrap()
      toast.success('Rental terms sent to renter')
      setTermsApplication(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const acceptTerms = async (terms) => {
    try {
      await acceptRentalTerms(terms._id).unwrap()
      toast.success('Rental terms accepted')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const submitChangeRequest = async () => {
    try {
      await requestRentalTermChanges({ id: changeTerms._id, message: changeMessage }).unwrap()
      toast.success('Change request sent to owner')
      setChangeTerms(null)
      setChangeMessage('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const agreementMessage = (agreement) => {
    if (!agreement) return owner
      ? 'Terms accepted by the renter. Create the rental agreement when you are ready.'
      : 'Terms accepted. The owner is preparing the rental agreement.'

    if (agreement.status === 'executed') {
      if (agreement.tenancy?.status === 'upcoming') return `Agreement complete. The rental is scheduled to start on ${shortDate(agreement.startDate)}.`
      if (agreement.tenancy?.status === 'active') return 'Agreement complete. The rental is now active.'
      return 'Agreement complete. Both parties have accepted the rental.'
    }

    const mySignature = owner ? agreement.ownerSignature : agreement.renterSignature
    const otherSignature = owner ? agreement.renterSignature : agreement.ownerSignature
    if (!mySignature?.signed) return 'The rental agreement is ready and waiting for your acceptance.'
    if (!otherSignature?.signed) return `You accepted the agreement. Waiting for the ${owner ? 'renter' : 'owner'} to accept it.`
    return 'The agreement is being finalized.'
  }

  if (query.isLoading || termsLoading || agreementsLoading) return <LoadingState />
  const items = query.data?.applications || []
  const agreementsPath = owner ? '/owner/agreements' : '/dashboard/agreements'
  const tenancyPath = owner ? '/owner/tenancies' : '/dashboard/tenancies'

  return (
    <>
      <PageHeader
        eyebrow={owner ? 'Owner inbox' : 'Your applications'}
        title="Rental applications"
        text={owner ? 'Review renter requests and follow accepted applications all the way through terms, agreement and rental activation.' : 'Track each application from owner decision through final terms, agreement and the start of your rental.'}
      />

      <div className="space-y-4">
        {items.length ? items.map((item, index) => {
          const terms = termsByApplication.get(String(item._id))
          const agreement = terms ? agreementsByTerms.get(String(terms._id)) : null
          const rentalStarted = agreement?.status === 'executed' && ['upcoming', 'active'].includes(agreement.tenancy?.status)

          return (
            <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Panel className="hover:border-cyan-300/15">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={item.status} />
                      <span className="text-xs font-bold text-slate-500">{pretty(item.applicationType)}</span>
                      {item.property?.reservationStatus === 'reserved' && <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-violet-200 ring-1 ring-violet-300/20">Reserved</span>}
                      {agreement?.status === 'executed' && <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-cyan-200 ring-1 ring-cyan-300/20">Agreement complete</span>}
                    </div>

                    <h2 className="mt-3 text-lg font-black text-white">{item.property?.title || 'Property'}</h2>
                    <p className="mt-1 text-sm text-slate-400">{owner ? `${item.applicant?.name || 'Applicant'} · ${item.applicant?.email || ''}` : `${item.property?.address?.area || ''} · ${money(item.property?.monthlyRent)}/month`}</p>
                    {item.applicationType === 'group' && <p className="mt-2 text-xs font-bold text-violet-300">Group application · {(item.roommates?.length || 0) + 1} people</p>}
                    {item.message && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{item.message}</p>}
                    {item.rejectionReason && <p className="mt-3 rounded-2xl border border-rose-400/15 bg-rose-400/8 p-3 text-sm text-rose-300">{item.rejectionReason}</p>}

                    {item.status === 'accepted' && !terms && (
                      <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4 text-sm text-slate-300">
                        {owner ? 'This renter has been selected. Confirm the final rent, deposit, move-in date and duration before an agreement is created.' : 'Your application was accepted. The owner is preparing the final rental terms for you to review.'}
                      </div>
                    )}

                    {item.status === 'accepted' && terms && (
                      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">Rental terms</p><StatusBadge value={terms.status} /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                          {[['Rent', money(terms.monthlyRent)], ['Deposit', money(terms.securityDeposit)], ['Move-in', shortDate(terms.startDate)], ['Duration', `${terms.durationMonths} months`], ['Occupants', terms.occupants]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/15 p-3"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p><p className="mt-1 text-xs font-black text-slate-200">{value}</p></div>)}
                        </div>
                        {terms.changeRequestMessage && <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100/80"><strong>Requested change:</strong> {terms.changeRequestMessage}</p>}
                        {terms.status === 'proposed' && owner && <p className="mt-3 text-xs text-slate-500">Waiting for the renter to accept these terms or request a change.</p>}
                        {terms.status === 'change_requested' && owner && <p className="mt-3 text-xs text-amber-200/80">The renter requested changes. Discuss them in messages, then revise and resend the terms.</p>}
                        {terms.status === 'accepted' && <div className={`mt-3 rounded-xl border p-3 text-xs font-bold leading-5 ${agreement?.status === 'executed' ? 'border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-100/85' : 'border-violet-300/15 bg-violet-300/[0.045] text-violet-100/85'}`}>{agreementMessage(agreement)}</div>}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-64 lg:justify-end">
                    <SecondaryButton disabled={conversationState.isLoading} onClick={() => openConversation(item)}><MessageCircle className="h-4 w-4" /> {owner ? 'Message renter' : 'Message owner'}</SecondaryButton>
                    {owner && item.status === 'pending' && <><PrimaryButton onClick={() => act(accept, item._id, 'Application accepted')}>Accept</PrimaryButton><SecondaryButton onClick={() => act(reject, { id: item._id, reason: 'Application was not selected at this time.' }, 'Application rejected')}>Reject</SecondaryButton></>}
                    {owner && item.status === 'accepted' && (!terms || ['proposed', 'change_requested'].includes(terms.status)) && <PrimaryButton onClick={() => openTerms(item, terms)}>{terms ? 'Revise rental terms' : 'Confirm rental terms'}</PrimaryButton>}
                    {!owner && item.status === 'pending' && <SecondaryButton onClick={() => act(withdraw, item._id, 'Application withdrawn')}>Withdraw</SecondaryButton>}
                    {!owner && item.status === 'accepted' && terms?.status === 'proposed' && <><PrimaryButton disabled={acceptTermsState.isLoading} onClick={() => acceptTerms(terms)}>Accept terms</PrimaryButton><SecondaryButton onClick={() => { setChangeTerms(terms); setChangeMessage('') }}>Request changes</SecondaryButton></>}
                    {item.status === 'accepted' && terms?.status === 'accepted' && !rentalStarted && <Link to={agreementsPath} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/[0.12]"><FileCheck2 className="h-4 w-4" /> {agreement ? 'Open agreement' : owner ? 'Create agreement' : 'Agreement status'}</Link>}
                    {rentalStarted && <Link to={tenancyPath} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/[0.12]">Open rental</Link>}
                  </div>
                </div>
              </Panel>
            </motion.div>
          )
        }) : <EmptyState title="No applications yet" text={owner ? 'Applications for your published properties will appear here.' : 'Browse rentals and apply when you find the right home.'} />}
      </div>

      <Modal open={Boolean(termsApplication)} onClose={() => setTermsApplication(null)} title="Confirm rental terms">
        <div className="space-y-5">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
            <p className="text-sm font-black text-cyan-100">Send the final proposal to the renter</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">These values should reflect what you and the renter discussed. Sending them does not start a tenancy or charge either person.</p>
          </div>
          {termsApplication && <div className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-600">Property</p><p className="mt-1 text-sm font-black text-white">{termsApplication.property?.title || 'Property'}</p></div><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-600">Renter</p><p className="mt-1 text-sm font-black text-white">{termsApplication.applicant?.name || 'Accepted applicant'}</p></div></div>}
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Move-in date</span><TextInput type="date" aria-label="Move-in date" value={termsForm.startDate} onChange={(event) => setTermsForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Rental duration</span><div className="relative"><TextInput type="number" min="1" max="120" aria-label="Rental duration in months" value={termsForm.durationMonths} onChange={(event) => setTermsForm((current) => ({ ...current, durationMonths: event.target.value }))} className="pr-20" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">months</span></div></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Final monthly rent (PKR)</span><TextInput type="number" min="0" aria-label="Final monthly rent" value={termsForm.monthlyRent} onChange={(event) => setTermsForm((current) => ({ ...current, monthlyRent: event.target.value }))} /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Security deposit (PKR)</span><TextInput type="number" min="0" aria-label="Security deposit" value={termsForm.securityDeposit} onChange={(event) => setTermsForm((current) => ({ ...current, securityDeposit: event.target.value }))} placeholder="Leave blank to use the listed deposit" /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Occupants</span><TextInput type="number" min="1" aria-label="Occupants" value={termsForm.occupants} onChange={(event) => setTermsForm((current) => ({ ...current, occupants: event.target.value }))} /></label>
          <div className="rounded-2xl border border-violet-300/12 bg-violet-300/[0.04] p-4 text-xs leading-5 text-slate-400">The property remains reserved while both sides finalize the deal.</div>
          <PrimaryButton disabled={proposeState.isLoading} className="w-full" onClick={submitTerms}>{proposeState.isLoading ? 'Sending terms…' : 'Send terms to renter'}</PrimaryButton>
        </div>
      </Modal>

      <Modal open={Boolean(changeTerms)} onClose={() => setChangeTerms(null)} title="Request changes">
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.045] p-4"><p className="text-sm font-black text-amber-100">Tell the owner what you would like to change</p><p className="mt-1 text-xs leading-5 text-slate-400">Ask about the move-in date, deposit, rent, duration or occupants, then continue the discussion in Messages.</p></div>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">Requested changes</span><TextArea maxLength={1000} value={changeMessage} onChange={(event) => setChangeMessage(event.target.value)} placeholder="Example: Could we reduce the security deposit?" /></label>
          <PrimaryButton disabled={requestChangesState.isLoading || changeMessage.trim().length < 3} className="w-full" onClick={submitChangeRequest}>{requestChangesState.isLoading ? 'Sending request…' : 'Send change request'}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

export default ApplicationsPage
