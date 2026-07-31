import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type AuthPageProps = {
  authToken: string | null
  authMessage: string | null
  handleLogin: (username: string, password: string) => Promise<void>
}

export default function AuthPage({ authToken, authMessage, handleLogin }: AuthPageProps) {
  const navigate = useNavigate()
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  useEffect(() => {
    if (authToken) {
      navigate('/admin')
    }
  }, [authToken, navigate])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleLogin(loginUsername, loginPassword)
  }

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <p className="eyebrow">Admin access only</p>
        <h2>Admin sign in</h2>
        <p className="hero-copy">Use your admin credentials to access the product management dashboard.</p>
        {authMessage ? <div className="alert-message">{authMessage}</div> : null}
        <div className="auth-actions">
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
        </div>
      </div>
    </section>
  )
}
