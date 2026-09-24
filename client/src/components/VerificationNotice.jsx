import { LoaderCircle, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { resendVerificationEmail } from '../features/auth/authSlice'

// Matches the server's resend cooldown. Inside it the server quietly sends
// nothing, so the button must not claim a link is on its way.
const COOLDOWN_SECONDS = 60

/**
 * Shown after signing up, on the sign-in page when an unconfirmed account
 * tries to log in, and when a confirmation link fails. Lets the person send
 * themselves a fresh link.
 *
 * `justSent` starts the cooldown immediately (a link went out a moment ago).
 * Without an `email` the person types one — a link opened in a new tab or on
 * another device has no remembered address.
 */
export default function VerificationNotice({ email, title, text, tone = 'info', justSent = false }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(null)
  const [typedEmail, setTypedEmail] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(() => (justSent ? Date.now() + COOLDOWN_SECONDS * 1000 : 0))
  const [now, setNow] = useState(() => Date.now())

  const address = (email || typedEmail).trim()
  const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  useEffect(() => {
    if (!cooldownUntil) return undefined
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= cooldownUntil) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownUntil])

  const resend = async () => {
    if (!address || sending || secondsLeft > 0) return
    setSending(true)
    const result = await dispatch(resendVerificationEmail(address))
    setSending(false)

    if (resendVerificationEmail.fulfilled.match(result)) {
      const current = Date.now()
      setSentAt(current)
      setNow(current)
      setCooldownUntil(current + COOLDOWN_SECONDS * 1000)
      toast.success(t('auth.verify.resent'))
      return
    }

    toast.error(result.payload || t('auth.verify.resendFailed'))
  }

  const palette = tone === 'warning'
    ? 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100'
    : 'border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100'

  return (
    <div className={`rounded-[20px] border p-5 ${palette}`}>
      <div className="flex gap-3">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs leading-6 text-white/60">{text}</p>
          {email ? (
            <p className="force-ltr mt-2 break-all text-xs font-black text-white/80">{email}</p>
          ) : (
            <input
              type="email"
              value={typedEmail}
              onChange={(event) => setTypedEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              aria-label={t('auth.email')}
              autoComplete="email"
              dir="ltr"
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/50 focus:outline-none"
            />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={sending || !address || secondsLeft > 0}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-xs font-black text-white transition hover:bg-white/[0.12] disabled:opacity-50"
            >
              {sending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
              {secondsLeft > 0 ? t('auth.verify.resendIn', { seconds: secondsLeft }) : t('auth.verify.resend')}
            </button>
            {sentAt && <span className="text-[11px] font-bold text-white/45">{t('auth.verify.resent')}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
