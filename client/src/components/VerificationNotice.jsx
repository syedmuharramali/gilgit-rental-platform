import { LoaderCircle, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { resendVerificationEmail } from '../features/auth/authSlice'

/**
 * Shown after signing up, and on the sign-in page when an unconfirmed
 * account tries to log in. Lets the person send themselves a fresh link.
 */
export default function VerificationNotice({ email, title, text, tone = 'info' }) {
  const dispatch = useDispatch()
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(null)

  const resend = async () => {
    if (!email || sending) return
    setSending(true)
    const result = await dispatch(resendVerificationEmail(email))
    setSending(false)

    if (resendVerificationEmail.fulfilled.match(result)) {
      setSentAt(Date.now())
      toast.success('If that address still needs confirming, a new link is on its way.')
      return
    }

    toast.error(result.payload || 'Unable to send a new link')
  }

  const palette = tone === 'warning'
    ? 'border-amber-300/25 bg-amber-300/[0.06] text-amber-100'
    : 'border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100'

  return (
    <div className={`rounded-[20px] border p-5 ${palette}`}>
      <div className="flex gap-3">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs leading-6 text-white/60">{text}</p>
          {email && <p className="mt-2 break-all text-xs font-black text-white/80">{email}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={sending || !email}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-xs font-black text-white transition hover:bg-white/[0.12] disabled:opacity-50"
            >
              {sending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
              Send the link again
            </button>
            {sentAt && <span className="text-[11px] font-bold text-white/45">Sent. Check spam too.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
