import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  LoadingState,
  PageHeader,
  Panel,
  PrimaryButton,
  StatusBadge,
  TextInput,
  shortDate,
} from '../../components/workspace/WorkspaceUI'
import { useGetMyVerificationQuery, useSubmitVerificationMutation } from '../../features/verification/verificationApi'

const ONE_MB = 1024 * 1024
const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'
const formatBytes = (bytes = 0) => bytes < ONE_MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / ONE_MB).toFixed(2)} MB`

export default function OwnerVerificationPage() {
  const { data, isLoading } = useGetMyVerificationQuery()
  const [submit, submitState] = useSubmitVerificationMutation()
  const [form, setForm] = useState({ cnicLast4: '', cnicFront: null, cnicBack: null, selfie: null })
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loaded: 0, total: 0, saving: false })

  if (isLoading) return <LoadingState />

  const current = data?.verification
  const canSubmit = !current || ['rejected', 'resubmission_required'].includes(current.status)

  const chooseFile = (key, label, file, input) => {
    if (!file) {
      setForm((currentForm) => ({ ...currentForm, [key]: null }))
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error(`${label} must be a JPG or PNG image.`)
      input.value = ''
      return
    }

    if (file.size > ONE_MB) {
      toast.error(`${label} is ${formatBytes(file.size)}. Please choose an image smaller than 1 MB.`)
      input.value = ''
      setForm((currentForm) => ({ ...currentForm, [key]: null }))
      return
    }

    setForm((currentForm) => ({ ...currentForm, [key]: file }))
  }

  const send = async () => {
    const files = [form.cnicFront, form.cnicBack, form.selfie]
    const total = files.reduce((sum, file) => sum + (file?.size || 0), 0)
    setUploadProgress({ percent: 0, loaded: 0, total, saving: false })

    try {
      await submit({
        ...form,
        onProgress: ({ loaded, total: progressTotal, percent }) => {
          setUploadProgress({ percent, loaded, total: progressTotal || total, saving: percent >= 100 })
        },
      }).unwrap()
      toast.success('Verification submitted')
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
    } catch (error) {
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader eyebrow="Trust & safety" title="Owner verification" text="Identity verification is required before listing a property. Documents are private and reviewed by administrators." />
      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <Panel>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><ShieldCheck className="h-6 w-6" /></div>
          <h2 className="mt-5 text-xl font-black text-white">Verification status</h2>
          <div className="mt-3"><StatusBadge value={data?.ownerVerified ? 'verified' : current?.status || 'not_submitted'} /></div>
          {current?.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4 text-sm text-rose-300">{current.rejectionReason}</p>}
          {current && <p className="mt-4 text-xs text-slate-500">Attempt #{current.attemptNumber} · submitted {shortDate(current.submittedAt)}</p>}
        </Panel>

        <Panel>
          <h2 className="font-black text-white">{canSubmit ? 'Submit identity documents' : data?.ownerVerified ? 'Identity verified' : 'Under review'}</h2>
          {canSubmit ? (
            <div className="mt-5 space-y-4">
              <div>
                <TextInput maxLength={4} inputMode="numeric" value={form.cnicLast4} onChange={(event) => setForm({ ...form, cnicLast4: event.target.value.replace(/\D/g, '') })} placeholder="Last 4 CNIC digits" />
                <p className="mt-2 text-xs text-slate-500">Use only the last 4 digits of the CNIC.</p>
              </div>

              {[
                ['cnicFront', 'CNIC front'],
                ['cnicBack', 'CNIC back'],
                ['selfie', 'Selfie'],
              ].map(([key, label]) => (
                <label key={key} className="block rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm font-bold text-slate-300 transition hover:border-cyan-300/25">
                  <span className="flex items-center justify-between gap-3"><span>{label}</span><span className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-300">Max 1 MB</span></span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={submitState.isLoading}
                    className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300/10 file:px-3 file:py-2 file:font-bold file:text-cyan-200 disabled:opacity-50"
                    onChange={(event) => chooseFile(key, label, event.target.files?.[0], event.target)}
                  />
                  {form[key] && <p className="mt-2 text-xs text-cyan-100/75">{form[key].name} · {formatBytes(form[key].size)}</p>}
                </label>
              ))}

              {submitState.isLoading && (
                <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.05] p-4">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                    <span>{uploadProgress.saving ? 'Upload complete · saving documents securely…' : `Uploading ${uploadProgress.percent}%`}</span>
                    <span>{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 transition-[width] duration-200" style={{ width: `${uploadProgress.percent}%` }} />
                  </div>
                </div>
              )}

              <PrimaryButton disabled={submitState.isLoading || form.cnicLast4.length !== 4 || !form.cnicFront || !form.cnicBack || !form.selfie} className="w-full" onClick={send}>{submitState.isLoading ? 'Submitting…' : 'Submit for review'}</PrimaryButton>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">{data?.ownerVerified ? 'You can now create and submit property listings.' : 'Your documents are waiting for an administrator decision.'}</p>
          )}
        </Panel>
      </div>
    </>
  )
}
