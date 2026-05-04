export type StarterEventType =
  | "brand.updated"
  | "store.created"
  | "store.updated"
  | "csv.imported"
  | "order.created"
  | "order.updated"
  | "risk.score.calculated"
  | "custom.rule.evaluated"
  | "address.checked"
  | "ndr.detected"
  | "prepaid.opportunity.created"
  | "policy.recommendation.created"
  | "action.created"
  | "action.completed"
  | "message.queued"
  | "message.status.updated"
  | "customer.response.recorded"
  | "savings.event.created"
  | "weekly.report.generated"
  | "monthly.strategy.generated"
  | "policy.simulation.created"
  | "data.deleted"
  | "plan.limit.warning"
  | "export.created"
  | "action.dismissed";

export interface StarterEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: StarterEventType;
  timestamp: string;
  sourceFeature: string;
  entityType: string;
  entityId?: string;
  payload: TPayload;
}

export type EventHandler<TPayload = Record<string, unknown>> = (event: StarterEvent<TPayload>) => void;
