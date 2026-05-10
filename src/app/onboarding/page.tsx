import {
  OsPageHeader,
  OsPanel,
  OsShell,
  OsStatusPill,
  formatCompact
} from "@/features/ai-operations-os/components/OsShell";
import { getOnboardingJourney } from "@/features/ai-operations-os";

export default function OnboardingPage() {
  const onboarding = getOnboardingJourney();

  return (
    <OsShell active="/onboarding">
      <OsPageHeader
        eyebrow="Onboarding"
        title="Connect Your Business"
        subtitle="Take the seller from signup to connected data with marketplace APIs, report upload fallback, and first AI diagnosis readiness."
      />

      <div className="os-layout-two">
        <OsPanel title="Setup Path" eyebrow="Step 2 of 5">
          <div className="os-stepper">
            {onboarding.steps.map((step, index) => (
              <article className={step.status === "active" ? "active" : ""} key={step.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.description}</p>
                </div>
                <OsStatusPill value={step.status} />
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Setup Summary">
          <div className="os-summary-stack">
            <div>
              <span>Estimated setup time</span>
              <strong>7-10 mins</strong>
              <small>{onboarding.connectedCount} of {onboarding.totalConnectionCount} core sources connected</small>
            </div>
            <div>
              <span>First diagnosis unlock</span>
              <strong>Orders + returns + settlements</strong>
              <small>Read-only data first. Upload fallback remains available.</small>
            </div>
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Marketplace Connection" eyebrow={onboarding.seller.companyName}>
        <div className="os-marketplace-grid">
          {onboarding.connections.map((connection) => (
            <article key={connection.id}>
              <div className="os-marketplace-card__top">
                <strong>{connection.label}</strong>
                <OsStatusPill value={connection.status} />
              </div>
              <p>{connection.accessMode.replaceAll("_", " ")} · {formatCompact(connection.recordsSynced)} records</p>
              <ul>
                {connection.permissions.map((permission) => <li key={permission}>{permission}</li>)}
              </ul>
              <button className="os-button os-button--secondary" type="button">
                {connection.status === "connected" ? "Manage Connection" : "Connect Now"}
              </button>
            </article>
          ))}
        </div>
      </OsPanel>

      <div className="os-layout-two">
        <OsPanel title="Business & Data Preferences">
          <div className="os-field-grid">
            <div><span>Monthly order volume</span><strong>{onboarding.seller.monthlyOrderVolume}</strong></div>
            <div><span>Primary categories</span><strong>{onboarding.seller.categories.join(", ")}</strong></div>
            <div><span>Pain points</span><strong>RTO, deductions, inventory, payout delays</strong></div>
            <div><span>First AI trigger</span><strong>Run after minimum source coverage is met</strong></div>
          </div>
        </OsPanel>

        <OsPanel title="Upload Historical Reports">
          <div className="os-upload-box">
            <strong>CSV, XLSX, XLS, PDF</strong>
            <p>Orders, returns, settlements, courier/NDR, bank, inventory, ads, reviews, support, and supplier files.</p>
          </div>
          <div className="os-file-list">
            {["Sales_Report_May2024.xlsx", "Returns_Jan-Apr2024.csv", "Payout_Summary.pdf"].map((file) => (
              <span key={file}>{file} <b>validated</b></span>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}

