# Local Client Demo Flow

Use this flow to test SupportWaala locally as if you are a D2C seller/client.

The client story is:

Free RTO Leakage Check -> RTO Profit Audit -> 14-Day RTO Rescue Pilot -> Daily Ops Control Room -> Founder Profit Intelligence.

## Quick Start

1. Run the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. In the sidebar, open **Demo / Client Test Mode**.
4. Click **Load Pro demo dataset** or choose a profile and click **Load selected demo**.

Demo data is fictional and for local testing.

## Guided Flow

1. **Load demo data**
   - Choose Fashion, Footwear, Beauty, Accessories, Wellness, or Gadget.
   - Generate at least 500 orders; Pro demos work best with 1,000-2,000 orders.

2. **Show the business problem in Profit Cockpit**
   - Review estimated preventable leakage.
   - Check COD %, RTO %, COD RTO %, NDR cases, estimated RTO loss, savings, and open actions.
   - Read the next best move.

3. **Present RTO Profit Audit**
   - Open Leakage Report.
   - Review pincode, courier, SKU, NDR, address, and prepaid recommendations.

4. **Open Daily Ops Control Room**
   - Use Focus mode for high/critical actions.
   - Queue a WhatsApp message or mark one action done.

5. **Complete one action**
   - Pick a high-risk COD, weak address, prepaid, or NDR action.
   - Click the relevant action button and then **Mark done**.

6. **Rescue one NDR**
   - Open NDR Rescue.
   - Select an urgent case.
   - Queue WhatsApp, request reattempt, record customer response, then mark delivered after NDR.

7. **Queue one message**
   - Open Messaging Outbox.
   - Select an order or NDR case.
   - Preview the template and queue a mock WhatsApp message.

8. **Record response**
   - In Messaging Outbox or Order Risk, enter a customer response.
   - Confirm that the response appears in the order/NDR timeline.

9. **Check Savings Ledger**
   - Review estimated savings, verified savings, rejected savings, messaging cost, software cost, and net benefit.
   - Verify, reject, or adjust one savings event.

10. **Show Founder Profit Intelligence**
   - Open Weekly Founder Report.
   - Review the narrative, next week focus, and open risks.
   - Print if needed.

11. **Run Policy Simulator**
   - Choose a policy type.
   - Adjust assumed reduction %, conversion loss %, and intervention cost.
   - Review saved leakage, lost contribution, intervention cost, and net benefit.

12. **Export report/workspace**
   - From Demo / Client Test Mode, export workspace JSON or orders CSV.
   - From Leakage Report, copy, print, or export JSON/CSV.

## Optional CSV Testing

You can also upload:

- `sample-data/demo-fashion-pro.csv`
- `sample-data/demo-footwear-growth.csv`
- `sample-data/demo-beauty-starter.csv`
- `sample-data/rto-pilot-sample-large.csv`

Use CSV Upload, review mapping/data quality, import valid rows, then return to Profit Cockpit.

## Reset

- Use **Reset demo data** in the sidebar to return to the seeded workspace.
- Use **Privacy & Audit** to delete local operational data.
- Refresh the browser after deleting data if you want to confirm localStorage reset behavior.
