export interface OnboardingChecklistItem {
  id: string;
  label: string;
  completed: boolean;
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
