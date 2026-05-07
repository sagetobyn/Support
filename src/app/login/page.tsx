'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { MarketingPage } from '@/components/marketing/MarketingChrome'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [brandName, setBrandName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        if (data.user) {
          const res = await fetch('/api/v1/users/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandName: brandName || email.split('@')[0] }),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Onboarding failed')
          }
          setMessage('Account created! Redirecting…')
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingPage tone="dark">
      <section className="login-section">
        <div className="login-card">
          {/* Logo */}
          <div className="login-card__logo">
            <div className="login-card__logomark">W</div>
            <span className="login-card__logoname">Wembro</span>
          </div>

          <h1 className="login-card__title">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="login-card__sub">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="login-card__toggle"
              onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="login-card__form">
            {isSignUp && (
              <label className="login-field">
                <span>Brand name</span>
                <input
                  className="input"
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="e.g. Acme Store"
                />
              </label>
            )}

            <label className="login-field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <div className="toast login-card__alert login-card__alert--error">{error}</div>}
            {message && <div className="toast login-card__alert login-card__alert--success">{message}</div>}

            <button
              type="submit"
              className="button full"
              disabled={loading}
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </MarketingPage>
  )
}
