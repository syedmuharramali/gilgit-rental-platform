import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { z } from 'zod'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import VerificationNotice from '../components/VerificationNotice'
import { clearAuthError, googleSignIn, registerUser } from '../features/auth/authSlice'

// Messages are translation keys, rendered with t() so they follow the language.
const registerSchema = z.object({
  name: z.string().trim().min(2, 'auth.err.nameMin').max(80, 'auth.err.nameMax'),
  email: z.string().trim().email('auth.err.email'),
  password: z.string().min(8, 'auth.err.passwordMin').regex(/[A-Z]/, 'auth.err.uppercase').regex(/[a-z]/, 'auth.err.lowercase').regex(/[0-9]/, 'auth.err.number'),
})

function FieldShell({ error, icon: Icon, children }) {
  return <div className={`relative flex h-14 items-center rounded-[18px] border bg-white/[0.045] transition focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-300/[0.035] ${error ? 'border-rose-400/60' : 'border-white/10 focus-within:border-cyan-300/30'}`}><Icon className="absolute left-4 h-4 w-4 text-white/28" />{children}</div>
}

function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, isAuthenticated } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [createdEmail, setCreatedEmail] = useState(null)
  const isLoading = status === 'loading'
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '' } })
  const password = watch('password') || ''

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }) }, [isAuthenticated, navigate])
  useEffect(() => { if (error) toast.error(error); return () => dispatch(clearAuthError()) }, [error, dispatch])

  const rules = useMemo(() => [[t('auth.rule.length'), password.length >= 8], [t('auth.rule.uppercase'), /[A-Z]/.test(password)], [t('auth.rule.lowercase'), /[a-z]/.test(password)], [t('auth.rule.number'), /[0-9]/.test(password)]], [password, t])

  const onSubmit = async (form) => {
    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) {
      setCreatedEmail(result.payload.email)
      toast.success(result.payload.emailSent
        ? t('auth.toast.created')
        : t('auth.toast.createdNoEmail'))
    }
  }

  const onGoogleCredential = useCallback(async (credential) => {
    const result = await dispatch(googleSignIn(credential))
    if (googleSignIn.fulfilled.match(result)) toast.success(t('auth.toast.googleConnected'))
  }, [dispatch, t])

  if (createdEmail) {
    return (
      <AuthLayout eyebrow={t('auth.verify.inboxEyebrow')} title={t('auth.verify.inboxTitle')} subtitle={t('auth.verify.inboxSubtitle')}>
        <VerificationNotice
          email={createdEmail}
          justSent
          title={t('auth.verify.inboxNoticeTitle')}
          text={t('auth.verify.inboxNoticeText')}
        />
        <p className="mt-6 text-center text-sm text-white/38">{t('auth.verify.alreadyConfirmed')} <Link className="font-black text-cyan-200 hover:text-white" to="/login">{t('common.signIn')}</Link></p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout eyebrow={t('auth.registerEyebrow')} title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">{t('auth.fullName')}</span><FieldShell error={errors.name} icon={UserRound}><input type="text" {...register('name')} autoComplete="name" placeholder={t('auth.fullNamePlaceholder')} className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /></FieldShell>{errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-300">{t(errors.name.message)}</p>}</label>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">{t('auth.email')}</span><FieldShell error={errors.email} icon={Mail}><input type="email" {...register('email')} autoComplete="email" placeholder={t('auth.emailPlaceholder')} className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /></FieldShell>{errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-300">{t(errors.email.message)}</p>}</label>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">{t('auth.password')}</span><FieldShell error={errors.password} icon={LockKeyhole}><input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="new-password" placeholder={t('auth.newPasswordPlaceholder')} className="h-full w-full bg-transparent pl-11 pr-12 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-white/28 transition hover:bg-white/8 hover:text-white" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></FieldShell>{errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-300">{t(errors.password.message)}</p>}</label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rules.map(([label, passed]) => <div key={label} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-2 text-[9px] font-black uppercase tracking-[.07em] ${passed ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : 'border-white/8 bg-white/[0.025] text-white/25'}`}><CheckCircle2 className="h-3.5 w-3.5" /> {label}</div>)}</div>

        <button type="submit" disabled={isLoading} className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-[#07101e] shadow-[0_18px_38px_rgba(56,189,248,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <>{t('common.createAccount')} <ArrowRight className="h-4 w-4" /></>}</button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.16em] text-white/24 before:h-px before:flex-1 before:bg-white/8 after:h-px after:flex-1 after:bg-white/8"><span>{t('auth.orContinue')}</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-white/38">{t('auth.haveAccount')} <Link className="font-black text-cyan-200 hover:text-white" to="/login">{t('common.signIn')}</Link></p>
    </AuthLayout>
  )
}

export default RegisterPage
