import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { clearAuthError, googleSignIn, registerUser } from '../features/auth/authSlice'

function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, token } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const isLoading = status === 'loading'

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    if (error) toast.error(error)
    return () => dispatch(clearAuthError())
  }, [error, dispatch])

  const rules = useMemo(
    () => [
      ['8+ characters', form.password.length >= 8],
      ['Uppercase', /[A-Z]/.test(form.password)],
      ['Lowercase', /[a-z]/.test(form.password)],
      ['Number', /[0-9]/.test(form.password)],
    ],
    [form.password],
  )

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) toast.success('Your account is ready')
  }

  const onGoogleCredential = useCallback(
    async (credential) => {
      const result = await dispatch(googleSignIn(credential))
      if (googleSignIn.fulfilled.match(result)) toast.success('Account connected with Google')
    },
    [dispatch],
  )

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Start a safer rental journey."
      subtitle="One account works for renters and verified owners, so you can discover, apply, list and manage rentals from the same place."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="field-wrap">
          <span className="field-label">Full name</span>
          <div className="field-shell">
            <UserRound className="field-icon" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              autoComplete="name"
              minLength={2}
              maxLength={80}
              placeholder="Your full name"
              required
            />
          </div>
        </label>

        <label className="field-wrap">
          <span className="field-label">Email address</span>
          <div className="field-shell">
            <Mail className="field-icon" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </label>

        <label className="field-wrap">
          <span className="field-label">Password</span>
          <div className="field-shell">
            <LockKeyhole className="field-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              className="field-action"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rules.map(([label, passed]) => (
            <div key={label} className={`password-rule ${passed ? 'is-valid' : ''}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>

        <button type="submit" disabled={isLoading} className="primary-action">
          {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Create account'}
        </button>
      </form>

      <div className="auth-divider"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />

      <p className="mt-7 text-center text-sm text-white/45">
        Already have an account?{' '}
        <Link className="font-semibold text-emerald-300 transition hover:text-emerald-200" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
