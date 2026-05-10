import { getConnectorDefinitions } from "./connectorRegistryService";
import { getDataQualityMetrics, getDataQualityScorecard } from "./dataQualityService";
import { getLineageRecords, getLineageSummary } from "./lineageService";
import { getMappingConfidenceSummary, getMappingPreviews, getMarketplaceIdMappings, getSkuMappings } from "./mappingService";
import {
  getCommerceGraphNodes,
  getEntityConfidenceSummary,
  getEntitySummaries,
  getNormalizedEntities,
  getNormalizedEntityPreview
} from "./normalizedEntityService";

export function getDataBrainOverview() {
  const entities = getEntitySummaries();
  const normalizedEntities = getNormalizedEntities();
  const skuMappings = getSkuMappings();
  const marketplaceIdMappings = getMarketplaceIdMappings();
  const lineageRecords = getLineageRecords();
  const totalEntities = entities.reduce((sum, entity) => sum + entity.count, 0);
  const weightedConfidence =
    entities.reduce((sum, entity) => sum + entity.confidence * entity.count, 0) / totalEntities;

  return {
    entities,
    graphNodes: getCommerceGraphNodes(),
    mappings: getMappingPreviews(),
    normalizedEntities,
    normalizedPreview: getNormalizedEntityPreview(8),
    skuMappings,
    marketplaceIdMappings,
    lineageRecords,
    lineageSummary: getLineageSummary(),
    confidenceSummary: getEntityConfidenceSummary(),
    mappingConfidence: getMappingConfidenceSummary(),
    qualityScorecard: getDataQualityScorecard(),
    sourceCount: getConnectorDefinitions().length,
    totalEntities,
    weightedConfidence,
    dataQuality: getDataQualityMetrics()
  };
}

export function getNormalizedRecordPreview(limit = 8) {
  return getNormalizedEntityPreview(limit);
}
