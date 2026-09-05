import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'

function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setScriptError(true)
      return undefined
    }

    let cancelled = false
    const initialize = () => {
      if (cancelled || !window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) onCredential(response.credential)
        },
      })

      buttonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 360,
      })
      setReady(true)
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`)
    if (existingScript) {
      if (window.google) initialize()
      else existingScript.addEventListener('load', initialize, { once: true })
      return () => {
        cancelled = true
        existingScript.removeEventListener('load', initialize)
      }
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.defer = true
    script.onload = initialize
    script.onerror = () => !cancelled && setScriptError(true)
    document.head.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [onCredential])

  if (scriptError) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        Google Sign-In is unavailable. Check VITE_GOOGLE_CLIENT_ID and your connection.
      </div>
    )
  }

  return (
    <div className={`google-button-shell ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      {!ready && (
        <div className="flex h-11 items-center justify-center gap-2 text-sm text-white/60">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading Google Sign-In
        </div>
      )}
      <div ref={buttonRef} className={ready ? 'flex justify-center' : 'hidden'} />
    </div>
  )
}

export default GoogleSignInButton
