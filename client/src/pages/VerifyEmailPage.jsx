import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import VerificationNotice from '../components/VerificationNotice'
import { verifyEmailToken } from '../features/auth/authSlice'

/**
 * Landing page for the link in the confirmation email:
 * /verify-email?token=...
 */
export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const pendingEmail = useSelector((state) => state.auth.pendingVerificationEmail)
  const [state, setState] = useState(token ? 'checking' : 'missing')
  const [message, setMessage] = useState('')
  const attempted = useRef(false)

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true

    dispatch(verifyEmailToken(token)).then((result) => {
      if (verifyEmailToken.fulfilled.match(result)) {
        setState('done')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1600)
        return
      }

      setState('failed')
      setMessage(result.payload || 'This confirmation link could not be used')
    })
  }, [token, dispatch, navigate])

  return (
    <AuthLayout
      eyebrow={t('auth.verify.eyebrow')}
      title={state === 'done' ? t('auth.verify.pageTitleDone') : t('auth.verify.pageTitle')}
      subtitle={t('auth.verify.pageSubtitle')}
    >
      {state === 'checking' && (
        <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-white/70">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
          {t('auth.verify.checking')}
        </div>
      )}

      {state === 'done' && (
        <div className="rounded-[20px] border border-cyan-300/25 bg-cyan-300/[0.07] p-5">
          <CheckCircle2 className="h-6 w-6 text-cyan-300" />
          <p className="mt-3 text-sm font-black text-cyan-100">{t('auth.verify.doneTitle')}</p>
          <p className="mt-1 text-xs leading-6 text-white/60">{t('auth.verify.doneText')}</p>
          <Link to="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 text-xs font-black text-[#07101e]">{t('auth.verify.goNow')}</Link>
        </div>
      )}

      {(state === 'failed' || state === 'missing') && (
        <div className="space-y-4">
          <div className="rounded-[20px] border border-rose-400/25 bg-rose-400/[0.07] p-5">
            <TriangleAlert className="h-6 w-6 text-rose-300" />
            <p className="mt-3 text-sm font-black text-rose-100">
              {state === 'missing' ? t('auth.verify.incompleteTitle') : t('auth.verify.failedTitle')}
            </p>
            <p className="mt-1 text-xs leading-6 text-white/60">
              {state === 'missing' ? t('auth.verify.incompleteText') : message}
            </p>
          </div>

          <VerificationNotice
            email={pendingEmail}
            tone="warning"
            title={t('auth.verify.needNewTitle')}
            text={pendingEmail
              ? t('auth.verify.needNewText')
              : t('auth.verify.needNewTextNoEmail')}
          />

          <p className="text-center text-sm text-white/38">
            <Link className="font-black text-cyan-200 hover:text-white" to="/login">{t('auth.verify.backToSignIn')}</Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
