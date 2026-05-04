# Starter Plan

Starter is the first paid self-serve RTOShield plan.

Price: INR 2,999/month.

Best for: small Indian D2C sellers around 300-700 orders/month, usually COD-heavy, working from Shopify, WooCommerce, Shiprocket, NimbusPost, Delhivery, or manual CSV exports.

Promise: Know where your RTO loss is coming from and get a basic action system to reduce COD/NDR leakage.

## Included Features

- One brand workspace and brand settings.
- CSV upload with alias mapping, preview, validation, duplicate update by `order_id + awb`, raw row storage, and local import summaries.
- Order ledger with filters, masked phones, risk score, and recommended action.
- Basic rule-based RTO risk scoring.
- Basic address quality checks.
- Basic NDR detection, reason normalization, and NDR rescue dashboard.
- Limited daily action queue for up to 50 visible actions at a time.
- Mock WhatsApp template outbox only.
- Manual customer response capture.
- Basic ROI and savings report.
- Basic printable RTO audit report.
- Privacy controls, audit logs, local delete, and local persistence.
- Plan and billing placeholder.

## Limits

- Monthly order limit: 500.
- Maximum CSV rows per import: 1,000.
- Daily action queue: limited/manual.
- WhatsApp: mock/manual outbox only.
- Response capture: manual only.
- Reports: basic.
- Real WhatsApp API: disabled.
- Shopify, WooCommerce, courier, and payment integrations: disabled.
- Managed ops, multi-brand, ML, returns, inventory, cashflow, and support inbox: not included.

## Architecture

Starter is organized as independent modules under `src/features/*`:

- `brand`
- `imports`
- `orders`
- `risk`
- `address`
- `ndr`
- `actions`
- `messaging`
- `responses`
- `roi`
- `reports`
- `privacy`
- `plans`

Each feature exposes its public API through `index.ts`. Cross-feature communication uses `src/shared/events` and small connector services in `src/shared/connectors`.

Core events:

- `brand.updated`
- `csv.imported`
- `order.created`
- `order.updated`
- `risk.score.calculated`
- `address.checked`
- `ndr.detected`
- `action.created`
- `action.completed`
- `message.queued`
- `customer.response.recorded`
- `savings.event.created`
- `data.deleted`

## Persistence

Starter uses browser `localStorage` with storage version `starter_v1`.

Stored locally:

- brand settings
- imports
- orders
- NDR cases
- actions
- mock messages
- customer responses
- savings events
- audit logs
- current plan

This MVP stores data locally in this browser/device unless configured otherwise. Production should use tenant-isolated server storage.

## Acceptance Criteria

- CSV import works without Shopify/courier integrations.
- Orders persist locally.
- Risk, address, NDR, actions, messaging, responses, ROI, reports, privacy, and plan limits work independently.
- Delivered/no-action orders are excluded from the daily queue and operational messaging.
- Savings events are estimates and never presented as guaranteed savings.
- Disabled Growth/Pro features show an upgrade placeholder.
- Tests cover CSV parsing, risk scoring, address checks, NDR normalization, action queue, messaging, responses, ROI, plan limits, and events.

