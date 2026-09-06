import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { z } from 'zod'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { clearAuthError, googleSignIn, loginUser } from '../features/auth/authSlice'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error, token } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const isLoading = status === 'loading'
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  useEffect(() => {
    if (token) navigate(location.state?.from || '/dashboard', { replace: true })
  }, [token, navigate, location.state])

  useEffect(() => {
    if (error) toast.error(error)
    return () => dispatch(clearAuthError())
  }, [error, dispatch])

  const onSubmit = async (form) => {
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) toast.success('Welcome back')
  }

  const onGoogleCredential = useCallback(async (credential) => {
    const result = await dispatch(googleSignIn(credential))
    if (googleSignIn.fulfilled.match(result)) toast.success('Signed in with Google')
  }, [dispatch])

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Your next home is closer."
      subtitle="Sign in to continue saved homes, applications, viewings and your rental journey."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Email address</span>
          <div className={`relative flex h-13 items-center rounded-[18px] border bg-slate-50 transition focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/[0.04] ${errors.email ? 'border-rose-300' : 'border-slate-200 focus-within:border-emerald-700/35'}`}>
            <Mail className="absolute left-4 h-4 w-4 text-slate-400" />
            <input type="email" {...register('email')} autoComplete="email" placeholder="you@example.com" className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400" />
          </div>
          {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.email.message}</p>}
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Password</span>
          <div className={`relative flex h-13 items-center rounded-[18px] border bg-slate-50 transition focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/[0.04] ${errors.password ? 'border-rose-300' : 'border-slate-200 focus-within:border-emerald-700/35'}`}>
            <LockKeyhole className="absolute left-4 h-4 w-4 text-slate-400" />
            <input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="current-password" placeholder="Enter your password" className="h-full w-full bg-transparent pl-11 pr-12 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.password.message}</p>}
        </label>

        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">Your session stays signed in on this device until you sign out or the server rejects the stored token.</p>

        <button type="submit" disabled={isLoading} className="flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#102f26] text-sm font-black text-white shadow-[0_16px_34px_rgba(16,47,38,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
          {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-slate-500">New here? <Link className="font-black text-[#245545] hover:text-[#102f26]" to="/register">Create an account</Link></p>
    </AuthLayout>
  )
}

export default LoginPage
