import {
  entitySummaries,
  graphNodes,
  normalizedCommerceEntities
} from "../data/mockCommerceData";
import type { CanonicalEntityType, NormalizedCommerceEntity } from "../domain/types";

export function getNormalizedEntities(): NormalizedCommerceEntity[] {
  return normalizedCommerceEntities;
}

export function getNormalizedEntitiesByType(entityType: CanonicalEntityType) {
  return normalizedCommerceEntities.filter((entity) => entity.entityType === entityType);
}

export function getNormalizedEntityPreview(limit = 10) {
  return normalizedCommerceEntities.slice(0, limit);
}

export function getEntitySummaries() {
  return entitySummaries;
}

export function getCommerceGraphNodes() {
  return graphNodes;
}

export function getEntityConfidenceSummary() {
  const high = normalizedCommerceEntities.filter((entity) => entity.confidence.label === "high").length;
  const medium = normalizedCommerceEntities.filter((entity) => entity.confidence.label === "medium").length;
  const low = normalizedCommerceEntities.filter((entity) => entity.confidence.label === "low").length;
  const average =
    normalizedCommerceEntities.reduce((sum, entity) => sum + entity.confidence.score, 0) / normalizedCommerceEntities.length;

  return {
    average,
    high,
    medium,
    low,
    total: normalizedCommerceEntities.length
  };
}
