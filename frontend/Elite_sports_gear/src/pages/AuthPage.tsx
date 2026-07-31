import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google?: any
  }
}

type AuthPageProps = {
  authToken: string | null
  authMessage: string | null
  accountMode: 'login' | 'register'
  setAccountMode: (mode: 'login' | 'register') => void
  handleLogin: (username: string, password: string) => Promise<void>
  handleRegister: (username: string, email: string, password: string) => Promise<void>
  handleGoogleLogin: (idToken: string) => Promise<void>
}

export default function AuthPage({
  authToken,
  authMessage,
  accountMode,
  setAccountMode,
  handleLogin,
  handleRegister,
  handleGoogleLogin,
}: AuthPageProps) {
  const navigate = useNavigate()
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (authToken) {
      navigate('/home')
    }
  }, [authToken, navigate])

  useEffect(() => {
    if (!googleClientId) {
      setGoogleError('Google sign-in is not configured.')
      return
    }

    if (window.google?.accounts?.id) {
      setGoogleReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        })
        setGoogleReady(true)
      } else {
        setGoogleError('Google script loaded but did not initialize.')
      }
    }
    script.onerror = () => {
      setGoogleError('Failed to load Google sign-in script.')
    }

    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [googleClientId])

  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      setGoogleError('Google login failed to return credentials.')
      return
    }
    try {
      await handleGoogleLogin(response.credential)
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'Google login failed')
    }
  }

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleLogin(loginUsername, loginPassword)
  }

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleRegister(registerUsername, registerEmail, registerPassword)
  }

  const triggerGoogleSignIn = () => {
    if (!googleReady || !window.google?.accounts?.id) {
      setGoogleError('Google sign-in is not ready yet.')
      return
    }
    window.google.accounts.id.prompt()
  }

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in to continue</h2>
        <p className="hero-copy">Login or create an account before browsing the store.</p>
        {authMessage ? <div className="alert-message">{authMessage}</div> : null}
        <div className="auth-toggle">
          <button className={`secondary-btn ${accountMode === 'login' ? 'active-tab' : ''}`} type="button" onClick={() => setAccountMode('login')}>
            Login
          </button>
          <button className={`secondary-btn ${accountMode === 'register' ? 'active-tab' : ''}`} type="button" onClick={() => setAccountMode('register')}>
            Register
          </button>
        </div>

        <div className="auth-actions">
          {accountMode === 'login' ? (
            <form onSubmit={submitLogin} className="auth-form">
              <input
                type="text"
                placeholder="Username or email"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button className="primary-btn wide" type="submit">
                Login
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="auth-form">
              <input
                type="text"
                placeholder="Username"
                required
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email address"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <button className="primary-btn wide" type="submit">
                Create account
              </button>
            </form>
          )}

          <div className="auth-divider">or continue with</div>
          <button className="google-btn" type="button" onClick={triggerGoogleSignIn} disabled={!googleClientId || !googleReady}>
            Continue with Google
          </button>
          {googleError ? <div className="alert-message">{googleError}</div> : null}
        </div>
      </div>
    </section>
  )
}
