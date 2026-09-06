import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { z } from 'zod'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { clearAuthError, googleSignIn, registerUser } from '../features/auth/authSlice'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters').max(80, 'Name cannot exceed 80 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string()
    .min(8, 'Password must contain at least 8 characters')
    .regex(/[A-Z]/, 'Add at least one uppercase letter')
    .regex(/[a-z]/, 'Add at least one lowercase letter')
    .regex(/[0-9]/, 'Add at least one number'),
})

function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, token } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const isLoading = status === 'loading'
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '' } })
  const password = watch('password') || ''

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    if (error) toast.error(error)
    return () => dispatch(clearAuthError())
  }, [error, dispatch])

  const rules = useMemo(() => [
    ['8+ characters', password.length >= 8],
    ['Uppercase', /[A-Z]/.test(password)],
    ['Lowercase', /[a-z]/.test(password)],
    ['Number', /[0-9]/.test(password)],
  ], [password])

  const onSubmit = async (form) => {
    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) toast.success('Your account is ready')
  }

  const onGoogleCredential = useCallback(async (credential) => {
    const result = await dispatch(googleSignIn(credential))
    if (googleSignIn.fulfilled.match(result)) toast.success('Account connected with Google')
  }, [dispatch])

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Start with one good place."
      subtitle="Use one account to discover rentals, apply, manage your tenancy and unlock owner tools after verification."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Full name</span>
          <div className={`relative flex h-13 items-center rounded-[18px] border bg-slate-50 transition focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/[0.04] ${errors.name ? 'border-rose-300' : 'border-slate-200 focus-within:border-emerald-700/35'}`}>
            <UserRound className="absolute left-4 h-4 w-4 text-slate-400" />
            <input type="text" {...register('name')} autoComplete="name" placeholder="Your full name" className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400" />
          </div>
          {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.name.message}</p>}
        </label>

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
            <input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="new-password" placeholder="Create a strong password" className="h-full w-full bg-transparent pl-11 pr-12 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.password.message}</p>}
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rules.map(([label, passed]) => <div key={label} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-2 text-[10px] font-bold ${passed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><CheckCircle2 className="h-3.5 w-3.5" /> {label}</div>)}
        </div>

        <button type="submit" disabled={isLoading} className="flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#102f26] text-sm font-black text-white shadow-[0_16px_34px_rgba(16,47,38,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
          {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Create account'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-black text-[#245545] hover:text-[#102f26]" to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}

export default RegisterPage
