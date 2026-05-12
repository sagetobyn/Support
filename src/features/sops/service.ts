export interface SopTemplate {
  id: string;
  title: string;
  purpose: string;
  whenToUse: string;
  steps: string[];
  owner: string;
  output: string;
  successMetric: string;
  targetView: "missions" | "ndr" | "pincode" | "prepaid" | "weekly" | "orders";
  docPath?: string;
  routeHref?: string;
}

export interface PilotOperatorSopBlock {
  id: string;
  title: string;
  window: string;
  goal: string;
  steps: string[];
  proofLog: string[];
}

export interface PilotOperatorWorkflow {
  id: string;
  title: string;
  trigger: string;
  operatorAction: string;
  proofRequired: string;
}

export interface PilotOperatorSop {
  title: string;
  docPath: string;
  promise: string;
  providerBoundary: string;
  routine: PilotOperatorSopBlock[];
  workflows: PilotOperatorWorkflow[];
  proofLogging: string[];
}

export const pilotOperatorSop: PilotOperatorSop = {
  title: "14-day pilot operator SOP",
  docPath: "docs/PILOT_OPERATOR_SOP.md",
  promise: "Run the daily COD/RTO/NDR rescue pilot from the action queue, NDR queue, prepaid opportunities, and savings ledger.",
  providerBoundary: "No live WhatsApp sending, courier API push, Shopify/WooCommerce sync, or automated execution is assumed. The operator records manual or mock-assisted work only.",
  routine: [
    {
      id: "morning",
      title: "Morning triage",
      window: "9:30-11:00",
      goal: "Pick the highest-loss COD/RTO/NDR work before dispatch and first courier attempts.",
      steps: [
        "Open Today's Priorities and confirm data/import warnings before acting.",
        "Open Work Queue and filter for high-risk COD, weak address, and NDR rescue work.",
        "Select the day's top COD/RTO/NDR cohort: risky COD before dispatch, active NDR, or weak address orders.",
        "Queue mock/manual COD confirmation, address correction, prepaid offer, or call task based on the recommendation reason.",
        "Mark only the work actually done; leave uncertain cases open."
      ],
      proofLog: [
        "Orders checked",
        "Risky COD found",
        "COD confirmations queued manually or in mock outbox",
        "Addresses needing correction",
        "NDR cases found"
      ]
    },
    {
      id: "afternoon",
      title: "Afternoon rescue loop",
      window: "2:00-4:00",
      goal: "Move active NDR/address/prepaid/call cases to a visible outcome before the day closes.",
      steps: [
        "Open Delivery Rescue and sort active NDR cases by SLA urgency and order value.",
        "For wrong-address or phone-unreachable NDR, request missing landmark, alternate phone, or corrected pincode manually.",
        "For high-risk COD or payment issue, offer prepaid conversion only when the incentive is within margin logic.",
        "For customer unavailable or refusal, place a manual call task and record the response intent.",
        "Request reattempt, cancel, or mark RTO only after the seller/operator has evidence."
      ],
      proofLog: [
        "NDRs contacted",
        "NDRs rescued",
        "Addresses corrected",
        "Prepaid offers accepted or declined",
        "Calls completed with response intent"
      ]
    },
    {
      id: "evening",
      title: "Evening proof close",
      window: "6:00-7:00",
      goal: "Turn the day's work into seller-visible proof without overclaiming savings.",
      steps: [
        "Open Savings Proof and log each avoided RTO or rescued shipment with the formula used.",
        "Keep estimated and verified savings separate.",
        "Attach the reason, action taken, outcome, and confidence note for each saving.",
        "Update the pilot day metrics and note blockers for tomorrow.",
        "Stop or narrow the pilot if data, owner, action, or proof gates are failing."
      ],
      proofLog: [
        "Estimated savings",
        "Verified savings when outcome is confirmed",
        "Rejected or uncertain savings",
        "Daily notes",
        "Next-day focus"
      ]
    }
  ],
  workflows: [
    {
      id: "ndr",
      title: "NDR rescue workflow",
      trigger: "New NDR, failed delivery, customer unavailable, refusal, wrong address, or phone unreachable.",
      operatorAction: "Use the NDR playbook, manually contact the customer or courier ops owner, then record reattempt, address update, cancellation, delivered, or RTO outcome.",
      proofRequired: "NDR reason, contact attempt, response or courier note, final outcome, and estimated or verified saving."
    },
    {
      id: "address",
      title: "Address correction workflow",
      trigger: "Weak address score, missing landmark, vague address, invalid pincode, wrong-address NDR, or alternate-phone request.",
      operatorAction: "Ask for corrected address details manually, update the seller/courier workflow outside Wembro, and record the correction note.",
      proofRequired: "Original issue, corrected field received, update timestamp, and delivery/NDR outcome."
    },
    {
      id: "prepaid",
      title: "COD-to-prepaid workflow",
      trigger: "High-risk COD order where prepaid conversion is safer than shipping blind.",
      operatorAction: "Share a seller-approved manual payment link or prepaid instruction outside Wembro, record accepted or declined, and avoid pressuring low-fit orders.",
      proofRequired: "Offer reason, incentive, accepted/declined status, and avoided RTO exposure if the order is cancelled before shipping or converted."
    },
    {
      id: "call",
      title: "Call workflow",
      trigger: "High-value order, repeated NDR, angry customer, phone-unreachable case, or unclear response.",
      operatorAction: "Call manually, record the customer intent, and choose reattempt, address update, prepaid conversion, cancellation, or no action.",
      proofRequired: "Call timestamp, intent, next action, owner, and outcome."
    }
  ],
  proofLogging: [
    "Never mark savings verified until the order outcome or seller confirmation supports it.",
    "Record estimate formula, confidence, source action, and before/after status.",
    "Use rejected or uncertain status when the action happened but the saving is not defensible.",
    "Daily proof must connect one action to one COD/RTO/NDR outcome."
  ]
};

export const sopTemplates: SopTemplate[] = [
  {
    id: "pilot-operator",
    title: pilotOperatorSop.title,
    purpose: "Run the 14-day pilot as a manual operator routine with daily proof logging.",
    whenToUse: "Every active paid pilot or pilot-prep run.",
    steps: [
      "Morning: triage data warnings, Work Queue, high-risk COD, weak address, and active NDR cases.",
      "Afternoon: work NDR rescue, address correction, prepaid offers, and call follow-up manually.",
      "Evening: log proof in the savings ledger, keep estimated and verified savings separate, and choose tomorrow's focus."
    ],
    owner: "Pilot operator",
    output: "Daily pilot metrics, action notes, and savings proof",
    successMetric: "Proof days with defensible estimated or verified savings",
    targetView: "missions",
    docPath: pilotOperatorSop.docPath,
    routeHref: "/pilot#operator-sop"
  },
  { id: "cod-verification", title: "COD verification SOP", purpose: "Confirm customer intent before dispatch.", whenToUse: "High-risk or high-value COD orders.", steps: ["Open daily action queue", "Check risk reason", "Send COD confirmation", "Hold until confirmed", "Cancel before shipping when customer declines"], owner: "Ops", output: "Confirmed/held/cancelled order", successMetric: "Lower COD RTO rate", targetView: "missions" },
  { id: "address-correction", title: "Address correction SOP", purpose: "Fix weak addresses before courier spend.", whenToUse: "Address score below threshold or wrong-address NDR.", steps: ["Send address correction template", "Collect landmark and alternate phone", "Update courier manually", "Record response"], owner: "Ops", output: "Corrected address note", successMetric: "Lower wrong-address NDR", targetView: "orders" },
  { id: "ndr-rescue", title: "NDR rescue SOP", purpose: "Rescue failed deliveries before RTO.", whenToUse: "Any new NDR case.", steps: ["Review normalized reason", "Use playbook", "Contact within SLA", "Request reattempt/address/call", "Mark delivered/RTO outcome"], owner: "Ops", output: "NDR action and outcome", successMetric: "Delivered after NDR", targetView: "ndr" },
  { id: "courier-escalation", title: "Courier escalation SOP", purpose: "Escalate repeat courier lane failures.", whenToUse: "Courier fake attempt or high-loss lane.", steps: ["Export affected orders", "Send courier escalation note", "Track 14-day switchback test", "Review lane metrics"], owner: "Founder/Ops", output: "Courier test decision", successMetric: "Lower courier-pincode RTO", targetView: "pincode" },
  { id: "cod-to-prepaid", title: "COD-to-prepaid SOP", purpose: "Convert risky COD without destroying margin.", whenToUse: "Open prepaid opportunities.", steps: ["Check max safe incentive", "Queue prepaid offer", "Record accepted/declined", "Create saving on accepted"], owner: "Ops", output: "Prepaid conversion status", successMetric: "Prepaid acceptance and avoided RTO exposure", targetView: "prepaid" },
  { id: "weekly-founder-review", title: "Weekly founder review SOP", purpose: "Turn ops work into decisions.", whenToUse: "Every weekly review.", steps: ["Generate weekly founder report", "Review top leakage drivers", "Accept/test/dismiss policies", "Pick next week focus"], owner: "Founder", output: "Weekly focus list", successMetric: "Net verified benefit", targetView: "weekly" }
];

export function sopToText(sop: SopTemplate) {
  return `${sop.title}\nPurpose: ${sop.purpose}\nWhen to use: ${sop.whenToUse}\nOwner: ${sop.owner}\nSteps:\n${sop.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nOutput: ${sop.output}\nSuccess metric: ${sop.successMetric}`;
}

export function pilotOperatorSopToMarkdown(sop: PilotOperatorSop = pilotOperatorSop) {
  return [
    `# ${sop.title}`,
    "",
    sop.promise,
    "",
    `Provider boundary: ${sop.providerBoundary}`,
    "",
    "## Daily rhythm",
    ...sop.routine.flatMap((block) => [
      "",
      `### ${block.title} (${block.window})`,
      `Goal: ${block.goal}`,
      "",
      ...block.steps.map((step, index) => `${index + 1}. ${step}`),
      "",
      `Proof log: ${block.proofLog.join(", ")}.`
    ]),
    "",
    "## Workflows",
    ...sop.workflows.flatMap((workflow) => [
      "",
      `### ${workflow.title}`,
      `Trigger: ${workflow.trigger}`,
      `Operator action: ${workflow.operatorAction}`,
      `Proof required: ${workflow.proofRequired}`
    ]),
    "",
    "## Proof logging rules",
    ...sop.proofLogging.map((rule) => `- ${rule}`)
  ].join("\n");
}
