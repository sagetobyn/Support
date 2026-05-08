import { MarketingPage } from '@/components/marketing/MarketingChrome'
import { LoginAuthPanel } from './LoginAuthPanel'

export default function LoginPage() {
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

          <LoginAuthPanel />
        </div>
      </section>
    </MarketingPage>
  )
}
