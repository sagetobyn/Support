import {
  mappingPreviews,
  marketplaceIdMappings,
  skuMappings
} from "../data/mockCommerceData";

export function getSkuMappings() {
  return skuMappings;
}

export function getMarketplaceIdMappings() {
  return marketplaceIdMappings;
}

export function getMappingPreviews() {
  return mappingPreviews;
}

export function getMappingConfidenceSummary() {
  const allScores = [
    ...skuMappings.map((mapping) => mapping.confidenceScore),
    ...marketplaceIdMappings.map((mapping) => mapping.confidenceScore)
  ];
  const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

  return {
    average,
    skuMappingCount: skuMappings.length,
    marketplaceMappingCount: marketplaceIdMappings.length,
    conflictCount: skuMappings.reduce((sum, mapping) => sum + mapping.conflictCount, 0),
    highConfidenceCount: allScores.filter((score) => score >= 97).length
  };
}
