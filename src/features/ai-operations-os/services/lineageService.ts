import { lineageRecords } from "../data/mockCommerceData";

export function getLineageRecords() {
  return lineageRecords;
}

export function getLineageForEntity(entityId: string) {
  return lineageRecords.filter((record) => record.entityId === entityId);
}

export function getLineageSummary() {
  const connectorIds = new Set(lineageRecords.map((record) => record.source.connectorId));
  const transformedFields = lineageRecords.reduce((sum, record) => sum + Object.keys(record.fieldMappings).length, 0);
  const positiveConfidenceRecords = lineageRecords.filter((record) => record.confidenceImpact > 0).length;

  return {
    totalRecords: lineageRecords.length,
    sourceCount: connectorIds.size,
    transformedFields,
    positiveConfidenceRecords
  };
}
