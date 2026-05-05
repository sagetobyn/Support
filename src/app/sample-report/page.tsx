import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/reporting";

const demo = {
  brand: "Nazrana Streetwear",
  category: "Fashion",
  monthlyOrders: 1800,
  codPercentage: 72,
  overallRto: 24,
  codRto: 31,
  averageOrderValue: 1299,
  lossPerRto: 425,
  pilotFee: 4999
};

const totalRtoOrders = demo.monthlyOrders * (demo.overallRto / 100);
const codOrders = demo.monthlyOrders * (demo.codPercentage / 100);
const codRtoOrders = codOrders * (demo.codRto / 100);
const monthlyLoss = totalRtoOrders * demo.lossPerRto;
const codLeakage = codRtoOrders * demo.lossPerRto;
const prepaidLeakage = monthlyLoss - codLeakage;
const savings10 = monthlyLoss * 0.1;
const savings20 = monthlyLoss * 0.2;
const savings30 = monthlyLoss * 0.3;

const pincodeClusters = [
  ["395007", 148, 52, "Verify COD orders before dispatch. For first-time buyers above ₹999, test prepaid-only or partial-prepaid policy."],
  ["302001", 126, 36, "Add address landmark check and prepaid nudge for high-value COD."],
  ["560095", 92, 20, "Review courier allocation and call high-value NDR cases."],
  ["201001", 88, 24, "Confirm COD intent before dispatch and hold weak-address orders."],
  ["700016", 76, 18, "Use pincode-specific COD confirmation and reattempt scheduling."]
] as const;

const courierIssues = [
  ["Delhivery", 420, 88, 42, "High COD failure in 395007", "Compare alternate courier on a 14-day switchback test."],
  ["Xpressbees", 360, 96, 48, "Customer unavailable and refused cases", "Run same-day WhatsApp plus call fallback for NDR."],
  ["Bluedart", 210, 32, 15, "Good metro performance, weaker COD clusters", "Keep for prepaid/high-value orders; review COD clusters."],
  ["DTDC", 180, 44, 20, "Address issue concentration", "Add address correction before dispatch."],
  ["Ekart", 220, 45, 26, "Late NDR updates", "Track NDR-to-action latency daily."],
  ["Shadowfax", 160, 38, 18, "Door locked and unavailable", "Use OFD reminder and reattempt slot confirmation."],
  ["Shiprocket", 250, 62, 31, "Mixed allocation hides courier-pincode issues", "Break reports by actual courier and pincode."]
] as const;

const skuLeakage = [
  ["DRESS-RED-S", 210, 62, "Size expectation mismatch", "Check product page expectation, size chart, COD customer intent, and ad campaign source."],
  ["SNEAK-WHT-8", 144, 38, "High-value COD hesitation", "Offer prepaid incentive and clearer exchange policy before dispatch."],
  ["KURTI-BLU-M", 188, 41, "Weak address and impulse COD", "Confirm delivery intent and address landmark."],
  ["EARBUDS-PRO", 122, 28, "Offer mismatch", "Audit ad creative, landing copy, and COD confirmation message."],
  ["TSH-BLK-L", 176, 30, "Fit uncertainty", "Improve size chart and buyer expectation copy."]
] as const;

const ndrReasons = [
  ["customer_unavailable", 86, "Send WhatsApp + call within 30-60 minutes of first failed attempt. Ask for reattempt slot."],
  ["customer_refused", 64, "Confirm COD intent and product expectation before the second attempt."],
  ["wrong_address", 42, "Ask for landmark, house number, and alternate phone before courier cutoff."],
  ["phone_unreachable", 38, "Validate phone pre-dispatch and call high-value cases."],
  ["payment_issue", 26, "Offer prepaid link or reschedule when cash is available."],
  ["door_locked", 21, "Ask customer to choose reattempt time and keep package active."]
] as const;

const actionQueue = [
  ["Confirm risky COD", "NS-2024, NS-2029, NS-2041"],
  ["Fix weak address", "NS-2018, NS-2070"],
  ["Push prepaid offer", "NS-2035, NS-2055, NS-2081"],
  ["Rescue NDR", "NS-2009, NS-2031, NS-2062"],
  ["Request reattempt", "NS-2031, NS-2090"],
  ["Call customer", "NS-2044, NS-2101"],
  ["Mark RTO / cancel", "NS-2066"]
] as const;

export default function SampleReportPage() {
  return (
    <main className="public-page report-page">
      <header className="public-header">
        <Link className="brand-link" href="/">SupportWaala</Link>
        <nav className="public-nav">
          <Link href="/calculator">Free Leakage Check</Link>
          <Link href="/sample-report">Sample Report</Link>
          <Link href="/audit">Profit Audit</Link>
          <Link href="/pilot">Rescue Pilot</Link>
          <Link href="/dashboard">Control Room</Link>
        </nav>
      </header>

      <section className="report-hero">
        <p className="eyebrow">This is fictional demo data</p>
        <h1>Sample Profit Leakage Audit for a Fashion D2C Brand</h1>
        <p className="hero-copy">A printable sample of the RTO Profit Audit a seller can review before sharing customer-level data. Brand, orders, couriers, pincodes, and SKUs below are fictional.</p>
        <p className="muted">Printable layout: use your browser print command to save or share this sample.</p>
      </section>

      <section className="report-summary-grid">
        <Metric label="Brand" value={demo.brand} />
        <Metric label="Monthly orders" value={formatNumber(demo.monthlyOrders)} />
        <Metric label="COD share" value={`${demo.codPercentage}%`} />
        <Metric label="Overall RTO" value={`${demo.overallRto}%`} />
        <Metric label="COD RTO" value={`${demo.codRto}%`} />
        <Metric label="Monthly leakage" value={formatCurrency(monthlyLoss)} />
      </section>

      <section className="report-section-grid">
        <ReportBlock title="1. Executive Summary">
          <p>{demo.brand} has {formatNumber(demo.monthlyOrders)} monthly orders, {demo.codPercentage}% COD, {demo.overallRto}% overall RTO, and {demo.codRto}% COD RTO. Estimated monthly leakage is {formatCurrency(monthlyLoss)}.</p>
          <p>Likely main drivers: COD intent, pincode concentration, NDR rescue delay, and address quality. Recommended next step: privacy-safe summary audit, then anonymized CSV if the estimate looks useful.</p>
        </ReportBlock>
        <ReportBlock title="2. Leakage Breakdown">
          <p>COD leakage estimate: <strong>{formatCurrency(codLeakage)}</strong></p>
          <p>Prepaid leakage estimate: <strong>{formatCurrency(prepaidLeakage)}</strong></p>
          <p>NDR-related leakage: <strong>{formatCurrency(monthlyLoss * 0.46)}</strong></p>
          <p>Courier/pincode concentration: <strong>{formatCurrency(monthlyLoss * 0.34)}</strong></p>
          <p>Address-quality leakage estimate: <strong>{formatCurrency(monthlyLoss * 0.18)}</strong></p>
        </ReportBlock>
        <TableBlock title="3. Top RTO Pincode Clusters" headers={["Pincode", "Orders", "RTO", "RTO %", "Estimated loss", "Recommendation"]} rows={pincodeClusters.map(([pin, orders, rto, rec]) => [pin, orders, rto, `${Math.round((rto / orders) * 100)}%`, formatCurrency(rto * demo.lossPerRto), rec])} />
        <TableBlock title="4. Top Courier Issues" headers={["Courier", "Shipments", "RTO", "NDR", "Pattern", "Recommendation"]} rows={courierIssues} />
        <TableBlock title="5. Top SKU / Product Leakage" headers={["SKU", "Orders", "RTO", "Suspected issue", "Recommended action"]} rows={skuLeakage.map(([sku, orders, rto, issue, action]) => [sku, orders, rto, issue, `${formatCurrency(rto * demo.lossPerRto)} loss. ${action}`])} />
        <TableBlock title="6. Top NDR Reasons" headers={["Reason", "Count", "Estimated loss", "Rescue recommendation"]} rows={ndrReasons.map(([reason, count, rec]) => [reason, count, formatCurrency(count * demo.lossPerRto), rec])} />
        <TableBlock title="7. Example Daily Action Queue" headers={["Group", "Example orders"]} rows={actionQueue} />
        <ReportBlock title="8. Example Order Decision Passport">
          <p><strong>Order:</strong> NS-2031 · <strong>Customer:</strong> Masked phone · <strong>Payment:</strong> COD · <strong>Value:</strong> ₹1,999 · <strong>Pincode:</strong> 395007 · <strong>Courier:</strong> Xpressbees · <strong>Risk:</strong> High</p>
          <ul>
            <li>COD order</li>
            <li>High-risk pincode</li>
            <li>Weak address</li>
            <li>High order value</li>
            <li>Courier has poor history in this cluster</li>
          </ul>
          <p><strong>Recommended action:</strong> Send COD confirmation + address correction. Offer prepaid incentive if confirmed.</p>
          <p><strong>Expected loss if RTO:</strong> ₹425 · <strong>Possible saving:</strong> ₹275-₹425</p>
        </ReportBlock>
        <ReportBlock title="9. Example NDR Rescue Workflow">
          <ol>
            <li>10:12 AM: NDR raised, customer unavailable.</li>
            <li>10:14 AM: WhatsApp rescue queued.</li>
            <li>10:21 AM: Customer selected reattempt tomorrow.</li>
            <li>10:25 AM: Ops requested reattempt.</li>
            <li>Next day: Delivered.</li>
          </ol>
          <p>Savings event: NDR rescued delivered, estimated ₹425 saved.</p>
        </ReportBlock>
        <ReportBlock title="10. Savings Opportunity">
          <div className="savings-grid">
            <div><span>10% reduction</span><strong>{formatCurrency(savings10)}</strong></div>
            <div><span>20% reduction</span><strong>{formatCurrency(savings20)}</strong></div>
            <div><span>30% reduction</span><strong>{formatCurrency(savings30)}</strong></div>
          </div>
          <p>Potential net benefit after ₹4,999 pilot fee at 20% reduction: <strong>{formatCurrency(savings20 - demo.pilotFee)}</strong>.</p>
        </ReportBlock>
        <ReportBlock title="11. Recommended 14-Day Pilot Plan">
          <p><strong>Day 1:</strong> Baseline audit and cost assumptions.</p>
          <p><strong>Days 2-3:</strong> Risk scoring and action queue setup.</p>
          <p><strong>Days 4-10:</strong> Daily COD verification, address correction, NDR rescue.</p>
          <p><strong>Days 11-13:</strong> Courier/pincode/SKU leakage analysis.</p>
          <p><strong>Day 14:</strong> Savings report and monthly plan proposal.</p>
        </ReportBlock>
        <ReportBlock title="12. Privacy-Safe Audit Options">
          <p><strong>Option A: Summary-only review.</strong> Needs monthly orders, COD %, RTO %, shipping cost, and average order value. No customer data.</p>
          <p><strong>Option B: Anonymized CSV audit.</strong> Needs order ID, pincode, payment mode, order value, courier, shipment status, NDR reason, and final outcome. No customer name, phone, email, or full address.</p>
          <p><strong>Option C: Full 14-day pilot.</strong> Phone/address may be needed only if the seller wants actual WhatsApp and address-correction workflows.</p>
          <p className="muted">Customer-level communication should only be used for delivery/RTO operations, not unrelated marketing.</p>
        </ReportBlock>
      </section>

      <section className="report-cta">
        <div>
          <h2>Ready to test your own numbers?</h2>
          <p>This sample does not use real seller data.</p>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/calculator">Open free calculator</Link>
          <Link className="button" href="/audit">Start privacy-safe audit</Link>
          <Link className="button secondary" href="/pilot">Book 14-day pilot discussion</Link>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="panel metric"><div className="label">{label}</div><div className="value">{value}</div></div>;
}

function ReportBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel report-block"><h2>{title}</h2>{children}</div>;
}

function TableBlock({ title, headers, rows }: { title: string; headers: string[]; rows: readonly (readonly unknown[])[] }) {
  return (
    <div className="panel report-block wide">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
