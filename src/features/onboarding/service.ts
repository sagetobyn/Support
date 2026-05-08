export interface OnboardingChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface OnboardingJourneyStep {
  id: string;
  title: string;
  view: "upload" | "briefing" | "missions" | "savings" | "weekly";
  owner: "Founder" | "Ops" | "Analyst";
  completed: boolean;
  metric: string;
  nextAction: string;
}

export const defaultOnboardingChecklist: OnboardingChecklistItem[] = [
  "Brand cost assumptions completed",
  "Stores added",
  "Baseline CSV uploaded",
  "Data quality reviewed",
  "Risk thresholds reviewed",
  "Custom rules reviewed",
  "NDR playbooks reviewed",
  "WhatsApp/manual messaging process selected",
  "First weekly report generated",
  "Monthly strategy report scheduled"
].map((label, index) => ({ id: `onboarding-${index + 1}`, label, completed: false }));

export function updateChecklist(items: OnboardingChecklistItem[], id: string, completed: boolean) {
  return items.map((item) => (item.id === id ? { ...item, completed } : item));
}

export function onboardingProgress(items: OnboardingChecklistItem[]) {
  const completed = items.filter((item) => item.completed).length;
  const percentage = Math.round((completed / Math.max(1, items.length)) * 100);
  const nextRecommendedStep = items.find((item) => !item.completed)?.label || "Pro onboarding complete";
  return { completed, total: items.length, percentage, nextRecommendedStep };
}

export function buildOnboardingJourney(input: {
  orderCount: number;
  dataTrustStatus: "empty" | "ready" | "limited" | "blocked";
  missionRemaining: number;
  savingsEventsCount: number;
  verifiedSavingsCount: number;
}) {
  const steps: OnboardingJourneyStep[] = [
    {
      id: "upload-data",
      title: "Upload seller CSV",
      view: "upload",
      owner: "Ops",
      completed: input.orderCount > 0,
      metric: `${input.orderCount.toLocaleString("en-IN")} orders loaded`,
      nextAction: "Upload the baseline order, courier, and NDR CSV."
    },
    {
      id: "review-trust",
      title: "Review data trust",
      view: "briefing",
      owner: "Founder",
      completed: input.dataTrustStatus === "ready" || input.dataTrustStatus === "limited",
      metric: input.dataTrustStatus,
      nextAction: "Check which recommendations are reliable, directional, or blocked."
    },
    {
      id: "clear-first-mission",
      title: "Clear first priority mission",
      view: "missions",
      owner: "Ops",
      completed: input.orderCount > 0 && input.missionRemaining < input.orderCount,
      metric: `${input.missionRemaining.toLocaleString("en-IN")} missions remaining`,
      nextAction: "Open the priority queue and complete the first action."
    },
    {
      id: "verify-savings",
      title: "Verify savings proof",
      view: "savings",
      owner: "Analyst",
      completed: input.verifiedSavingsCount > 0,
      metric: `${input.verifiedSavingsCount.toLocaleString("en-IN")} verified events`,
      nextAction: input.savingsEventsCount ? "Verify or reject estimated savings events." : "Complete an action that creates a savings event."
    },
    {
      id: "founder-report",
      title: "Review founder report",
      view: "weekly",
      owner: "Founder",
      completed: input.verifiedSavingsCount > 0 && input.dataTrustStatus !== "blocked",
      metric: input.verifiedSavingsCount > 0 ? "ready for review" : "needs proof",
      nextAction: "Open the weekly report and choose one decision for the next operating cycle."
    }
  ];
  return {
    steps,
    progress: onboardingProgress(steps.map((step) => ({ id: step.id, label: step.title, completed: step.completed }))),
    nextStep: steps.find((step) => !step.completed)
  };
}
