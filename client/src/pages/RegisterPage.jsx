import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
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
  password: z.string().min(8, 'Password must contain at least 8 characters').regex(/[A-Z]/, 'Add at least one uppercase letter').regex(/[a-z]/, 'Add at least one lowercase letter').regex(/[0-9]/, 'Add at least one number'),
})

function FieldShell({ error, icon: Icon, children }) {
  return <div className={`relative flex h-14 items-center rounded-[18px] border bg-white/[0.045] transition focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-300/[0.035] ${error ? 'border-rose-400/60' : 'border-white/10 focus-within:border-cyan-300/30'}`}><Icon className="absolute left-4 h-4 w-4 text-white/28" />{children}</div>
}

function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, token } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const isLoading = status === 'loading'
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '' } })
  const password = watch('password') || ''

  useEffect(() => { if (token) navigate('/dashboard', { replace: true }) }, [token, navigate])
  useEffect(() => { if (error) toast.error(error); return () => dispatch(clearAuthError()) }, [error, dispatch])

  const rules = useMemo(() => [['8+ characters', password.length >= 8], ['Uppercase', /[A-Z]/.test(password)], ['Lowercase', /[a-z]/.test(password)], ['Number', /[0-9]/.test(password)]], [password])

  const onSubmit = async (form) => {
    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) toast.success('Your account is ready')
  }

  const onGoogleCredential = useCallback(async (credential) => {
    const result = await dispatch(googleSignIn(credential))
    if (googleSignIn.fulfilled.match(result)) toast.success('Account connected with Google')
  }, [dispatch])

  return (
    <AuthLayout eyebrow="Create your account" title="Start with one great place." subtitle="Build your preferences, save homes and unlock the full rental journey from one account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Full name</span><FieldShell error={errors.name} icon={UserRound}><input type="text" {...register('name')} autoComplete="name" placeholder="Your full name" className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /></FieldShell>{errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-300">{errors.name.message}</p>}</label>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Email address</span><FieldShell error={errors.email} icon={Mail}><input type="email" {...register('email')} autoComplete="email" placeholder="you@example.com" className="h-full w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /></FieldShell>{errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-300">{errors.email.message}</p>}</label>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Password</span><FieldShell error={errors.password} icon={LockKeyhole}><input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="new-password" placeholder="Create a strong password" className="h-full w-full bg-transparent pl-11 pr-12 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/22" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-white/28 transition hover:bg-white/8 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></FieldShell>{errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-300">{errors.password.message}</p>}</label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{rules.map(([label, passed]) => <div key={label} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-2 text-[9px] font-black uppercase tracking-[.07em] ${passed ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : 'border-white/8 bg-white/[0.025] text-white/25'}`}><CheckCircle2 className="h-3.5 w-3.5" /> {label}</div>)}</div>

        <button type="submit" disabled={isLoading} className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-[#07101e] shadow-[0_18px_38px_rgba(56,189,248,.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}</button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.16em] text-white/24 before:h-px before:flex-1 before:bg-white/8 after:h-px after:flex-1 after:bg-white/8"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-white/38">Already have an account? <Link className="font-black text-cyan-200 hover:text-white" to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}

export default RegisterPage
