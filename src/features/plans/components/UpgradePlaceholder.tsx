import { getUpgradePlaceholder } from "@/features/plans";

export function UpgradePlaceholder() {
  return <div className="notice">{getUpgradePlaceholder()}</div>;
}

