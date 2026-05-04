import type { Message } from "@/types/domain";

export function MockOutboxStatusBadge({ status }: { status: Message["status"] }) {
  return <span className="badge neutral">{status.replaceAll("_", " ")}</span>;
}

