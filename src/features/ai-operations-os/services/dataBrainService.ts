import { aiOperationsWorkspace } from "../data/mockOperatingSystem";

export function getDataBrainOverview() {
  const totalEntities = aiOperationsWorkspace.entitySummaries.reduce((sum, entity) => sum + entity.count, 0);
  const weightedConfidence =
    aiOperationsWorkspace.entitySummaries.reduce((sum, entity) => sum + entity.confidence * entity.count, 0) / totalEntities;

  return {
    entities: aiOperationsWorkspace.entitySummaries,
    graphNodes: aiOperationsWorkspace.graphNodes,
    mappings: aiOperationsWorkspace.mappings,
    totalEntities,
    weightedConfidence,
    dataQuality: aiOperationsWorkspace.dataQuality
  };
}

export function getNormalizedRecordPreview() {
  return aiOperationsWorkspace.mappings;
}

