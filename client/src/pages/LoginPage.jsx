import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { z } from 'zod'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import VerificationNotice from '../components/VerificationNotice'
import { clearAuthError, googleSignIn, loginUser } from '../features/auth/authSlice'
import { useGetMyVerificationQuery } from '../features/verification/verificationApi'

// Messages are translation keys, rendered with t() so they follow the language.
const loginSchema = z.object({
  email: z.string().trim().email('auth.err.email'),
  password: z.string().min(1, 'auth.err.passwordRequired'),
})

const getPostLoginDestination = (user, ownerVerified, requestedPath) => {
  if (user?.role === 'admin') {
    return typeof requestedPath === 'string' && requestedPath.startsWith('/admin')
      ? requestedPath
      : '/admin'
  }

  if (typeof requestedPath === 'string' && !requestedPath.startsWith('/admin')) {
    return requestedPath
  }

  return ownerVerified ? '/owner' : '/dashboard'
}

function FieldShell({ error, icon: Icon, children }) {
  return (
    <div className={`relative flex h-14 items-center rounded-[18px] border bg-white/[0.045] transition focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-300/[0.035] ${error ? 'border-rose-400/60' : 'border-white/10 focus-within:border-cyan-300/30'}`}>
      <Icon className="absolute left-4 h-4 w-4 text-white/28" />
      {children}
    </div>
  )
}

function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error, isAuthenticated: token, user, pendingVerificationEmail } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const isLoading = status === 'loading'
  const shouldCheckVerification = Boolean(token && user && user.role !== 'admin')
  const {
    data: verificationData,
    isLoading: isVerificationLoading,
    isFetching: isCheckingVerification,
    isUninitialized: isVerificationUninitialized,
    isError: verificationFailed,
  } = useGetMyVerificationQuery(undefined, {
    skip: !shouldCheckVerification,
  })
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  useEffect(() => {
    if (!token || !user) return

    if (user.role !== 'admin') {
      if (
        isVerificationUninitialized ||
        isVerificationLoading ||
        isCheckingVerification
      ) return

      if (!verificationData && !verificationFailed) return
    }

    navigate(
      getPostLoginDestination(user, Boolean(verificationData?.ownerVerified), location.state?.from),
      { replace: true },
    )
  }, [
    token,
    user,
    verificationData,
    isVerificationLoading,
    isCheckingVerification,
    isVerificationUninitialized,
    verificationFailed,
    navigate,
    location.state,
  ])

  useEffect(() => { if (error) toast.error(error); return () => dispatch(clearAuthError()) }, [error, dispatch])

  const onSubmit = async (form) => {
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) toast.success(t('auth.toast.welcome'))
  }

  const onGoogleCredential = useCallback(async (credential) => {
    const result = await dispatch(googleSignIn(credential))
    if (googleSignIn.fulfilled.match(result)) toast.success(t('auth.toast.google'))
  }, [dispatch, t])

  return (
    <AuthLayout eyebrow={t('auth.signInEyebrow')} title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      {pendingVerificationEmail && (
        <div className="mb-5">
          <VerificationNotice
            email={pendingVerificationEmail}
            tone="warning"
            title={t('auth.verify.loginNoticeTitle')}
            text={t('auth.verify.loginNoticeText')}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">{t('auth.email')}</span>
          <FieldShell error={errors.email} icon={Mail}>
            <input type="email" {...register('email')} autoComplete="email" placeholder={t('auth.emailPlaceholder')} className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" />
          </FieldShell>
          {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-300">{t(errors.email.message)}</p>}
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">{t('auth.password')}</span>
          <FieldShell error={errors.password} icon={LockKeyhole}>
            <input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="current-password" placeholder={t('auth.passwordPlaceholder')} className="h-full w-full bg-transparent pl-11 pr-12 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-white/28 transition hover:bg-white/8 hover:text-white" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </FieldShell>
          {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-300">{t(errors.password.message)}</p>}
        </label>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-white/35"><span>{t('auth.sessionNote')}</span><span className="shrink-0 font-black text-cyan-200">{t('auth.protected')}</span></div>

        <button type="submit" disabled={isLoading} className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-[#07101e] shadow-[0_18px_38px_rgba(56,189,248,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <>{t('common.signIn')} <ArrowRight className="h-4 w-4" /></>}</button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.16em] text-white/24 before:h-px before:flex-1 before:bg-white/8 after:h-px after:flex-1 after:bg-white/8"><span>{t('auth.orContinue')}</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-white/38">{t('auth.noAccount')} <Link className="font-black text-cyan-200 hover:text-white" to="/register">{t('common.createAccount')}</Link></p>
    </AuthLayout>
  )
}

export default LoginPage
