import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import AuthLayout from '../layouts/AuthLayout'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { clearAuthError, googleSignIn, loginUser } from '../features/auth/authSlice'

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error, token } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const isLoading = status === 'loading'

  useEffect(() => {
    if (token) navigate(location.state?.from || '/dashboard', { replace: true })
  }, [token, navigate, location.state])

  useEffect(() => {
    if (error) toast.error(error)
    return () => dispatch(clearAuthError())
  }, [error, dispatch])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) toast.success('Welcome back')
  }

  const onGoogleCredential = useCallback(
    async (credential) => {
      const result = await dispatch(googleSignIn(credential))
      if (googleSignIn.fulfilled.match(result)) toast.success('Signed in with Google')
    },
    [dispatch],
  )

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Find your place in Gilgit."
      subtitle="Sign in to manage applications, saved homes, viewings and every step of your rental journey."
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-white/45">
            <input type="checkbox" className="accent-emerald-400" />
            Keep me signed in
          </label>
          <span className="cursor-not-allowed text-white/30" title="Password recovery will be added with the account settings phase">
            Forgot password?
          </span>
        </div>

        <button type="submit" disabled={isLoading} className="primary-action">
          {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <div className="auth-divider"><span>or continue with</span></div>
      <GoogleSignInButton onCredential={onGoogleCredential} disabled={isLoading} />

      <p className="mt-7 text-center text-sm text-white/45">
        New to Gilgit Rental?{' '}
        <Link className="font-semibold text-emerald-300 transition hover:text-emerald-200" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
