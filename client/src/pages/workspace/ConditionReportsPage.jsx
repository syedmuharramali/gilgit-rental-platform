import { Eye, Plus, UploadCloud } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useConfirmConditionReportMutation,
  useCreateConditionReportMutation,
  useGetConditionReportsQuery,
  useUploadConditionEvidenceMutation,
} from '../../features/conditionReports/conditionReportsApi'
import {
  useGetMyTenanciesQuery,
  useGetOwnedTenanciesQuery,
} from '../../features/tenancies/tenanciesApi'
import { createPrivateFileUrl } from '../../services/privateFiles'
import {
  EmptyState,
  LoadingState,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  StatusBadge,
  TextArea,
  TextInput,
  pretty,
} from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || error?.message || 'Something went wrong'
const initialItems = () => [{ area: 'Living area', condition: 'good', notes: '' }]
const glass = 'rounded-2xl border border-white/[0.07] bg-white/[0.035]'

export default function ConditionReportsPage({ owner = false }) {
  const location = useLocation()
  const requestedTenancy = useMemo(() => new URLSearchParams(location.search).get('tenancy') || '', [location.search])
  const myTenancies = useGetMyTenanciesQuery(undefined, { skip: owner })
  const ownedTenancies = useGetOwnedTenanciesQuery(undefined, { skip: !owner })
  const tenancies = owner ? ownedTenancies.data?.tenancies || [] : myTenancies.data?.tenancies || []
  const [tenancyId, setTenancyId] = useState(requestedTenancy)
  const selected = tenancyId || requestedTenancy || tenancies[0]?._id || ''
  const selectedTenancy = tenancies.find((tenancy) => String(tenancy._id) === String(selected))
  const canCreate = selectedTenancy?.status === 'active'
  const { data, isLoading, refetch } = useGetConditionReportsQuery(selected, { skip: !selected })
  const [create, createState] = useCreateConditionReportMutation()
  const [confirm, confirmState] = useConfirmConditionReportMutation()
  const [upload, uploadState] = useUploadConditionEvidenceMutation()
  const [type, setType] = useState('move_in')
  const [items, setItems] = useState(initialItems)
  const [overallNotes, setOverallNotes] = useState('')
  const [preview, setPreview] = useState(null)
  const [openingEvidence, setOpeningEvidence] = useState(null)

  useEffect(() => {
    if (requestedTenancy) setTenancyId(requestedTenancy)
  }, [requestedTenancy])

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
  }, [preview])

  const addItem = () => {
    if (items.length >= 50) return
    setItems((current) => [...current, { area: '', condition: 'good', notes: '' }])
  }

  const updateItem = (index, key, value) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }

  const removeItem = (index) => {
    if (items.length === 1) return
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const submit = async () => {
    if (!canCreate) {
      toast.error('Condition reports can only be created while the rental is active')
      return
    }

    const cleanedItems = items
      .map((item) => ({ area: item.area.trim(), condition: item.condition, notes: item.notes.trim() || undefined }))
      .filter((item) => item.area)

    if (!cleanedItems.length) {
      toast.error('Add at least one property area')
      return
    }

    try {
      await create({ tenancyId: selected, reportType: type, items: cleanedItems, overallNotes: overallNotes.trim() || undefined }).unwrap()
      toast.success('Condition report created')
      setItems(initialItems())
      setOverallNotes('')
      await refetch()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const confirmReport = async (reportId) => {
    try {
      await confirm(reportId).unwrap()
      toast.success('Your confirmation has been recorded')
      await refetch()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const uploadEvidence = async (reportId, fileList) => {
    const files = [...fileList]
    if (!files.length) return
    if (files.length > 6) {
      toast.error('Upload up to 6 evidence images at a time')
      return
    }

    try {
      await upload({ id: reportId, files }).unwrap()
      toast.success('Evidence uploaded securely')
      await refetch()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const viewEvidence = async (reportId, evidence) => {
    setOpeningEvidence(evidence._id)
    try {
      if (preview?.url) URL.revokeObjectURL(preview.url)
      const url = await createPrivateFileUrl(`/condition-reports/${reportId}/evidence/${evidence._id}`)
      setPreview({ url, name: evidence.name || 'Condition evidence' })
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setOpeningEvidence(null)
    }
  }

  const reports = data?.reports || []

  return (
    <>
      <PageHeader
        eyebrow="Property condition"
        title="Condition reports"
        text="Document move-in and move-out condition during an active rental, attach private evidence, and have both parties confirm the shared record."
        action={tenancies.length ? (
          <Select value={selected} onChange={(event) => setTenancyId(event.target.value)}>
            {tenancies.map((tenancy) => <option key={tenancy._id} value={tenancy._id}>{tenancy.property?.title} · {pretty(tenancy.status)}</option>)}
          </Select>
        ) : null}
      />

      {!selected ? (
        <EmptyState title="No tenancy available" text="Condition reports become available once you have a rental record." />
      ) : (
        <div className={`grid gap-6 ${canCreate ? 'xl:grid-cols-[.8fr_1.2fr]' : ''}`}>
          {canCreate ? (
            <Panel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-black text-white">Create report</h2>
                  <p className="mt-1 text-xs text-slate-500">Create one move-in and one move-out report while the rental is active.</p>
                </div>
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] font-black text-slate-400">{items.length}/50 areas</span>
              </div>

              <div className="mt-4 space-y-3">
                <Select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="move_in">Move in</option>
                  <option value="move_out">Move out</option>
                </Select>

                {items.map((item, index) => (
                  <div key={`${index}-${item.area}`} className={`${glass} p-3`}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <TextInput value={item.area} maxLength={100} onChange={(event) => updateItem(index, 'area', event.target.value)} placeholder="Area / room" />
                      <Select value={item.condition} onChange={(event) => updateItem(index, 'condition', event.target.value)}>
                        {['excellent', 'good', 'fair', 'poor', 'damaged'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                      </Select>
                    </div>
                    <TextArea className="mt-2 min-h-20" maxLength={500} value={item.notes} onChange={(event) => updateItem(index, 'notes', event.target.value)} placeholder="Notes" />
                    {items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="mt-2 text-xs font-black text-rose-300">Remove item</button>}
                  </div>
                ))}

                <SecondaryButton disabled={items.length >= 50} onClick={addItem}><Plus className="h-4 w-4" /> Add area</SecondaryButton>
                <TextArea maxLength={1500} value={overallNotes} onChange={(event) => setOverallNotes(event.target.value)} placeholder="Overall notes" />
                <PrimaryButton disabled={createState.isLoading} className="w-full" onClick={submit}>Create {type === 'move_in' ? 'move-in' : 'move-out'} report</PrimaryButton>
              </div>
            </Panel>
          ) : (
            <Panel className="border-violet-300/15 bg-violet-300/[0.04]">
              <StatusBadge value={selectedTenancy?.status || 'unknown'} />
              <h2 className="mt-3 font-black text-white">Condition history is read-only</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {selectedTenancy?.status === 'upcoming'
                  ? 'The rental has not started yet. Move-in and move-out reports unlock once the rental becomes active.'
                  : 'This rental has ended. Existing condition reports remain available as part of the rental history, but new reports can no longer be created.'}
              </p>
            </Panel>
          )}

          <div className="space-y-4">
            {isLoading ? <LoadingState /> : reports.length ? reports.map((report, index) => {
              const evidenceLocked = report.status === 'confirmed' || report.ownerConfirmation?.confirmed || report.renterConfirmation?.confirmed
              return (
                <motion.div key={report._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <Panel>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <StatusBadge value={report.status} />
                        <h3 className="mt-2 font-black text-white">{pretty(report.reportType)} report</h3>
                        <p className="mt-1 text-xs text-slate-500">Created by {report.createdBy?.name || 'tenancy participant'}</p>
                      </div>
                      {report.status !== 'confirmed' && <SecondaryButton disabled={confirmState.isLoading} onClick={() => confirmReport(report._id)}>Confirm my side</SecondaryButton>}
                    </div>

                    <div className="mt-4 space-y-2">
                      {report.items?.map((item) => (
                        <div key={item._id || item.area} className={`${glass} p-3 text-sm`}>
                          <strong className="text-white">{item.area}</strong>
                          <span className="ml-2 text-slate-400">{pretty(item.condition)}</span>
                          {item.notes && <p className="mt-1 text-slate-400">{item.notes}</p>}
                        </div>
                      ))}
                    </div>

                    {report.overallNotes && <p className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-sm leading-6 text-slate-300">{report.overallNotes}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <span>Owner {report.ownerConfirmation?.confirmed ? '✓ confirmed' : 'awaiting'}</span>
                      <span>Renter {report.renterConfirmation?.confirmed ? '✓ confirmed' : 'awaiting'}</span>
                      <span>{report.evidence?.length || 0} evidence file(s)</span>
                    </div>

                    {report.evidence?.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {report.evidence.map((evidence) => (
                          <button type="button" key={evidence._id} disabled={openingEvidence === evidence._id} onClick={() => viewEvidence(report._id, evidence)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05] disabled:opacity-50">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Eye className="h-4 w-4" /></span>
                            <span className="min-w-0"><span className="block truncate text-xs font-black text-slate-200">{evidence.name || 'Evidence image'}</span><span className="text-[10px] text-slate-500">View securely</span></span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!evidenceLocked && canCreate && (
                      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.06] px-4 py-3 text-xs font-black text-cyan-200">
                        <UploadCloud className="h-4 w-4" /> {uploadState.isLoading ? 'Uploading…' : 'Add evidence'}
                        <input type="file" accept="image/png,image/jpeg" multiple className="hidden" disabled={uploadState.isLoading} onChange={(event) => { uploadEvidence(report._id, event.target.files); event.target.value = '' }} />
                      </label>
                    )}

                    {evidenceLocked && report.status !== 'confirmed' && <p className="mt-4 text-xs leading-5 text-amber-300">Evidence is locked because one party has already confirmed this report.</p>}
                  </Panel>
                </motion.div>
              )
            }) : <EmptyState title="No condition reports yet" text={canCreate ? 'Create the move-in report when the rental begins, and the move-out report before ending it.' : 'No condition records were created for this rental.'} />}
          </div>
        </div>
      )}

      <Modal open={Boolean(preview)} onClose={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null) }} title={preview?.name || 'Condition evidence'}>
        {preview?.url && <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full rounded-2xl bg-[#080d17] object-contain" />}
      </Modal>
    </>
  )
}
