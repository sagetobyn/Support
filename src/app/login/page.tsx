'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { MarketingPage } from '@/components/marketing/MarketingChrome'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [brandName, setBrandName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
  const supabase = isSupabaseConfigured
    ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
    : null

  async function onboardCurrentUser(fallbackBrandName: string) {
    const res = await fetch('/api/v1/users/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: fallbackBrandName }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'We could not finish workspace setup. Please try again.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        if (!data.session) {
          setMessage('Account created. Check your email to confirm it, then sign in here.')
          setIsSignUp(false)
          return
        }

        await onboardCurrentUser(brandName.trim() || email.split('@')[0])
        setMessage('Account created. Opening your dashboard.')
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        await onboardCurrentUser(brandName.trim() || email.split('@')[0])
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
        <div className="login-shell">
          <aside className="login-proof" aria-label="Wembro account benefits">
            <div className="login-proof__eyebrow">Profit recovery workspace</div>
            <h1>Recover checkout leakage without chasing spreadsheets.</h1>
            <p>
              Sign in to review COD risk, NDR queues, RTO exposure, and savings proof from one focused control room.
            </p>
            <div className="login-proof__metrics" aria-label="Platform highlights">
              <span><strong>18%</strong> COD risk flagged</span>
              <span><strong>42</strong> NDR cases queued</span>
              <span><strong>₹3.8L</strong> savings tracked</span>
            </div>
          </aside>

          <div className="login-card" aria-live="polite">
            <div className="login-card__logo">
              <div className="login-card__logomark">W</div>
              <span className="login-card__logoname">Wembro</span>
            </div>

            <h2 className="login-card__title">
              {isSignUp ? 'Create your workspace' : 'Welcome back'}
            </h2>
            <p className="login-card__sub">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="login-card__toggle"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
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
                    placeholder="Acme Store"
                    autoComplete="organization"
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
                  autoComplete="email"
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </label>

              {!isSupabaseConfigured && (
                <div className="toast login-card__alert login-card__alert--error">
                  Login is not configured in this environment.
                </div>
              )}
              {error && <div className="toast login-card__alert login-card__alert--error">{error}</div>}
              {message && <div className="toast login-card__alert login-card__alert--success">{message}</div>}

              <button
                type="submit"
                className="button full"
                disabled={loading || !isSupabaseConfigured}
              >
                {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="login-card__fineprint">
              Protected by Supabase Auth. Your workspace is created after email confirmation when your project requires it.
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  )
}
