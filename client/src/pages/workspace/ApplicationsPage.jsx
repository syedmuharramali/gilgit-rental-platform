import { useMemo, useState } from 'react'
import { FileCheck2, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
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

function ApplicationsPage({ owner = false }) {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
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

  // Accepting is not reversible: it also rejects every other pending application.
  const acceptWithConfirmation = (item) => {
    const applicantName = item.applicant?.name || t('apps.thisApplicant')
    const confirmed = window.confirm(
      t('apps.confirmAccept', { applicant: applicantName, property: item.property?.title || t('apps.thisProperty') }),
    )
    if (!confirmed) return
    act(accept, item._id, t('apps.toastAccepted'))
  }

  const openConversation = async (application) => {
    try {
      const result = await startApplicationConversation(application._id).unwrap()
      const conversationId = result?.data?.conversation?._id || result?.conversation?._id
      if (!conversationId) return toast.error(t('apps.conversationFailed'))
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
      toast.success(t('apps.termsSent'))
      setTermsApplication(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const acceptTerms = async (terms) => {
    try {
      await acceptRentalTerms(terms._id).unwrap()
      toast.success(t('apps.termsAccepted'))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const submitChangeRequest = async () => {
    try {
      await requestRentalTermChanges({ id: changeTerms._id, message: changeMessage }).unwrap()
      toast.success(t('apps.changeSent'))
      setChangeTerms(null)
      setChangeMessage('')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const agreementMessage = (agreement) => {
    if (!agreement) return owner ? t('apps.agreementNoneOwner') : t('apps.agreementNoneRenter')

    if (agreement.status === 'executed') return t('apps.agreementExecuted')

    const mySignature = owner ? agreement.ownerSignature : agreement.renterSignature
    const otherSignature = owner ? agreement.renterSignature : agreement.ownerSignature
    if (!mySignature?.signed) return t('apps.agreementWaitingMe')
    if (!otherSignature?.signed) return t('apps.agreementWaitingOther', { party: owner ? t('apps.renter') : t('apps.owner') })
    return t('apps.agreementFinalizing')
  }

  if (query.isLoading || termsLoading || agreementsLoading) return <LoadingState />
  const items = query.data?.applications || []
  const agreementsPath = owner ? '/owner/agreements' : '/dashboard/agreements'

  return (
    <>
      <PageHeader
        eyebrow={owner ? t('apps.eyebrowOwner') : t('apps.eyebrowRenter')}
        title={t('apps.title')}
        text={owner ? t('apps.textOwner') : t('apps.textRenter')}
      />

      <div className="space-y-4">
        {items.length ? items.map((item, index) => {
          const terms = termsByApplication.get(String(item._id))
          const agreement = terms ? agreementsByTerms.get(String(terms._id)) : null
          const agreementComplete = agreement?.status === 'executed'

          return (
            <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Panel className="hover:border-cyan-300/15">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={item.status} />
                      <span className="text-xs font-bold text-slate-500">{pretty(item.applicationType)}</span>
                      {item.property?.reservationStatus === 'reserved' && <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-violet-200 ring-1 ring-violet-300/20">{t('details.reserved')}</span>}
                      {agreement?.status === 'executed' && <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-cyan-200 ring-1 ring-cyan-300/20">{t('apps.agreementCompleteBadge')}</span>}
                    </div>

                    <h2 className="mt-3 text-lg font-black text-white">{item.property?.title || t('apps.property')}</h2>
                    <p className="mt-1 text-sm text-slate-400">{owner ? `${item.applicant?.name || t('apps.applicant')} · ${item.applicant?.email || ''}` : `${item.property?.address?.area || ''} · ${money(item.property?.monthlyRent)}${t('common.perMonth')}`}</p>
                    {item.applicationType === 'group' && <p className="mt-2 text-xs font-bold text-violet-300">{t('apps.groupPeople', { count: (item.roommates?.length || 0) + 1 })}</p>}
                    {item.message && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{item.message}</p>}
                    {item.rejectionReason && <p className="mt-3 rounded-2xl border border-rose-400/15 bg-rose-400/8 p-3 text-sm text-rose-300">{item.rejectionReason}</p>}

                    {item.status === 'accepted' && !terms && (
                      <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4 text-sm text-slate-300">
                        {owner ? t('apps.acceptedOwnerNoTerms') : t('apps.acceptedRenterNoTerms')}
                      </div>
                    )}

                    {item.status === 'accepted' && terms && (
                      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-[.12em] text-cyan-300">{t('apps.rentalTerms')}</p><StatusBadge value={terms.status} /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                          {[[t('apps.rent'), money(terms.monthlyRent)], [t('apps.deposit'), money(terms.securityDeposit)], [t('apps.moveIn'), shortDate(terms.startDate)], [t('apps.duration'), t('apps.durationMonths', { count: terms.durationMonths })], [t('apps.occupants'), terms.occupants]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/15 p-3"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-slate-600">{label}</p><p className="mt-1 text-xs font-black text-slate-200">{value}</p></div>)}
                        </div>
                        {terms.changeRequestMessage && <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100/80"><strong>{t('apps.requestedChange')}</strong> {terms.changeRequestMessage}</p>}
                        {terms.status === 'proposed' && owner && <p className="mt-3 text-xs text-slate-500">{t('apps.waitingRenter')}</p>}
                        {terms.status === 'change_requested' && owner && <p className="mt-3 text-xs text-amber-200/80">{t('apps.changeRequestedOwner')}</p>}
                        {terms.status === 'accepted' && <div className={`mt-3 rounded-xl border p-3 text-xs font-bold leading-5 ${agreement?.status === 'executed' ? 'border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-100/85' : 'border-violet-300/15 bg-violet-300/[0.045] text-violet-100/85'}`}>{agreementMessage(agreement)}</div>}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-64 lg:justify-end">
                    <SecondaryButton disabled={conversationState.isLoading} onClick={() => openConversation(item)}><MessageCircle className="h-4 w-4" /> {owner ? t('apps.messageRenter') : t('apps.messageOwner')}</SecondaryButton>
                    {owner && item.status === 'pending' && <><PrimaryButton onClick={() => acceptWithConfirmation(item)}>{t('apps.accept')}</PrimaryButton><SecondaryButton onClick={() => act(reject, { id: item._id, reason: t('apps.defaultRejectReason') }, t('apps.toastRejected'))}>{t('apps.reject')}</SecondaryButton></>}
                    {owner && item.status === 'accepted' && (!terms || ['proposed', 'change_requested'].includes(terms.status)) && <PrimaryButton onClick={() => openTerms(item, terms)}>{terms ? t('apps.reviseTerms') : t('apps.confirmTerms')}</PrimaryButton>}
                    {!owner && item.status === 'pending' && <SecondaryButton onClick={() => act(withdraw, item._id, t('apps.toastWithdrawn'))}>{t('apps.withdraw')}</SecondaryButton>}
                    {!owner && item.status === 'accepted' && terms?.status === 'proposed' && <><PrimaryButton disabled={acceptTermsState.isLoading} onClick={() => acceptTerms(terms)}>{t('apps.acceptTerms')}</PrimaryButton><SecondaryButton onClick={() => { setChangeTerms(terms); setChangeMessage('') }}>{t('apps.requestChanges')}</SecondaryButton></>}
                    {item.status === 'accepted' && terms?.status === 'accepted' && <Link to={agreementsPath} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/[0.12]"><FileCheck2 className="h-4 w-4" /> {agreementComplete ? t('apps.agreementCompleteBadge') : agreement ? t('apps.openAgreement') : owner ? t('apps.createAgreement') : t('apps.agreementStatus')}</Link>}
                  </div>
                </div>
              </Panel>
            </motion.div>
          )
        }) : <EmptyState title={t('apps.emptyTitle')} text={owner ? t('apps.emptyOwner') : t('apps.emptyRenter')} />}
      </div>

      <Modal open={Boolean(termsApplication)} onClose={() => setTermsApplication(null)} title={t('apps.modalTitle')}>
        <div className="space-y-5">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
            <p className="text-sm font-black text-cyan-100">{t('apps.modalIntroTitle')}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{t('apps.modalIntroText')}</p>
          </div>
          {termsApplication && <div className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-600">{t('apps.property')}</p><p className="mt-1 text-sm font-black text-white">{termsApplication.property?.title || t('apps.property')}</p></div><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-600">{t('apps.renter')}</p><p className="mt-1 text-sm font-black text-white">{termsApplication.applicant?.name || t('apps.applicant')}</p></div></div>}
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.fieldMoveIn')}</span><TextInput type="date" aria-label={t('apps.fieldMoveIn')} value={termsForm.startDate} onChange={(event) => setTermsForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.fieldDuration')}</span><div className="relative"><TextInput type="number" min="1" max="120" aria-label={t('apps.fieldDuration')} value={termsForm.durationMonths} onChange={(event) => setTermsForm((current) => ({ ...current, durationMonths: event.target.value }))} className="pr-20" /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">{t('apps.months')}</span></div></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.fieldRent')}</span><TextInput type="number" min="0" aria-label={t('apps.fieldRent')} value={termsForm.monthlyRent} onChange={(event) => setTermsForm((current) => ({ ...current, monthlyRent: event.target.value }))} /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.fieldDeposit')}</span><TextInput type="number" min="0" aria-label={t('apps.fieldDeposit')} value={termsForm.securityDeposit} onChange={(event) => setTermsForm((current) => ({ ...current, securityDeposit: event.target.value }))} placeholder={t('apps.depositPlaceholder')} /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.fieldOccupants')}</span><TextInput type="number" min="1" aria-label={t('apps.fieldOccupants')} value={termsForm.occupants} onChange={(event) => setTermsForm((current) => ({ ...current, occupants: event.target.value }))} /></label>
          <div className="rounded-2xl border border-violet-300/12 bg-violet-300/[0.04] p-4 text-xs leading-5 text-slate-400">{t('apps.reservedNote')}</div>
          <PrimaryButton disabled={proposeState.isLoading} className="w-full" onClick={submitTerms}>{proposeState.isLoading ? t('apps.sendingTerms') : t('apps.sendTerms')}</PrimaryButton>
        </div>
      </Modal>

      <Modal open={Boolean(changeTerms)} onClose={() => setChangeTerms(null)} title={t('apps.changeModalTitle')}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.045] p-4"><p className="text-sm font-black text-amber-100">{t('apps.changeIntroTitle')}</p><p className="mt-1 text-xs leading-5 text-slate-400">{t('apps.changeIntroText')}</p></div>
          <label className="block"><span className="mb-2 block text-xs font-black text-slate-200">{t('apps.changeLabel')}</span><TextArea maxLength={1000} value={changeMessage} onChange={(event) => setChangeMessage(event.target.value)} placeholder={t('apps.changePlaceholder')} /></label>
          <PrimaryButton disabled={requestChangesState.isLoading || changeMessage.trim().length < 3} className="w-full" onClick={submitChangeRequest}>{requestChangesState.isLoading ? t('apps.sendingRequest') : t('apps.sendChangeRequest')}</PrimaryButton>
        </div>
      </Modal>
    </>
  )
}

export default ApplicationsPage
