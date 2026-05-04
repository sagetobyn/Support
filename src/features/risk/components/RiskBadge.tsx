import type { RiskBucket } from "@/types/domain";

export function RiskBadge({ bucket }: { bucket: RiskBucket }) {
  return <span className={`badge ${bucket.toLowerCase()}`}>{bucket}</span>;
}

