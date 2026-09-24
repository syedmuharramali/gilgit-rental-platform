import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
const formatBytes = (bytes = 0) => bytes < ONE_MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / ONE_MB).toFixed(2)} MB`

export default function OwnerVerificationPage() {
  const { t } = useTranslation()
  const errorMessage = (error) => error?.data?.message || error?.error || t('common.somethingWrong')
  const { data, isLoading } = useGetMyVerificationQuery()
  const [submit, submitState] = useSubmitVerificationMutation()
  const [form, setForm] = useState({ cnicLast4: '', cnicFront: null, cnicBack: null, selfie: null })
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loaded: 0, total: 0, saving: false })

  if (isLoading) return <LoadingState />

  const current = data?.verification
  const canSubmit = !current || current.status === 'resubmission_required'
  // A final rejection cannot be resubmitted; it used to read "Under review".
  const isClosed = !data?.ownerVerified && current?.status === 'rejected'

  const chooseFile = (key, label, file, input) => {
    if (!file) {
      setForm((currentForm) => ({ ...currentForm, [key]: null }))
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error(t('ver.mustBeImage', { label }))
      input.value = ''
      return
    }

    if (file.size > ONE_MB) {
      toast.error(t('ver.tooLarge', { label, size: formatBytes(file.size) }))
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
      toast.success(t('ver.toastSubmitted'))
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
    } catch (error) {
      setUploadProgress({ percent: 0, loaded: 0, total: 0, saving: false })
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader eyebrow={t('ver.eyebrow')} title={t('ver.title')} text={t('ver.text')} />
      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <Panel>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><ShieldCheck className="h-6 w-6" /></div>
          <h2 className="mt-5 text-xl font-black text-white">{t('ver.status')}</h2>
          <div className="mt-3"><StatusBadge value={data?.ownerVerified ? 'verified' : current?.status || 'not_submitted'} /></div>
          {current?.rejectionReason && <p className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4 text-sm text-rose-300">{current.rejectionReason}</p>}
          {current && <p className="mt-4 text-xs text-slate-500">{t('ver.attempt', { number: current.attemptNumber, date: shortDate(current.submittedAt) })}</p>}
        </Panel>

        <Panel>
          <h2 className="font-black text-white">{canSubmit ? t('ver.submitDocs') : data?.ownerVerified ? t('ver.verified') : isClosed ? t('ver.rejectedTitle') : t('ver.underReview')}</h2>
          {canSubmit ? (
            <div className="mt-5 space-y-4">
              <div>
                <TextInput maxLength={4} inputMode="numeric" value={form.cnicLast4} onChange={(event) => setForm({ ...form, cnicLast4: event.target.value.replace(/\D/g, '') })} placeholder={t('ver.cnicPlaceholder')} />
                <p className="mt-2 text-xs text-slate-500">{t('ver.cnicHint')}</p>
              </div>

              {[
                ['cnicFront', t('ver.cnicFront')],
                ['cnicBack', t('ver.cnicBack')],
                ['selfie', t('ver.selfie')],
              ].map(([key, label]) => (
                <label key={key} className="block rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-4 text-sm font-bold text-slate-300 transition hover:border-cyan-300/25">
                  <span className="flex items-center justify-between gap-3"><span>{label}</span><span className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-300">{t('ver.maxSize')}</span></span>
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
                    <span>{uploadProgress.saving ? t('ver.uploadSaving') : t('ver.uploading', { percent: uploadProgress.percent })}</span>
                    <span>{formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 transition-[width] duration-200" style={{ width: `${uploadProgress.percent}%` }} />
                  </div>
                </div>
              )}

              <PrimaryButton disabled={submitState.isLoading || form.cnicLast4.length !== 4 || !form.cnicFront || !form.cnicBack || !form.selfie} className="w-full" onClick={send}>{submitState.isLoading ? t('ver.submitting') : t('ver.submitForReview')}</PrimaryButton>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">{data?.ownerVerified ? t('ver.verifiedNote') : isClosed ? t('ver.rejectedNote') : t('ver.waitingNote')}</p>
          )}
        </Panel>
      </div>
    </>
  )
}
