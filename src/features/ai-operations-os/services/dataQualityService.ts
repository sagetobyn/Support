import { connectorDefinitions, ingestionJobs, sourceFreshness } from "../data/mockConnectors";
import { normalizedCommerceEntities } from "../data/mockCommerceData";
import type { DataQualityMetric, DataQualityScorecard } from "../domain/types";

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

function roundRate(value: number) {
  return Math.round(value * 100) / 100;
}

export function getDataQualityScorecard(): DataQualityScorecard {
  const totalRecords = connectorDefinitions.reduce((sum, connector) => sum + connector.recordCount, 0);
  const failedRecords = ingestionJobs.reduce((sum, job) => sum + job.failedCount, 0);
  const missingFieldRows = ingestionJobs.find((job) => job.connectorId === "support-messages")?.failedCount || 0;
  const staleSources = sourceFreshness.filter((source) => source.status === "stale").length;
  const failedSources = sourceFreshness.filter((source) => source.status === "failed").length;
  const averageConfidence =
    normalizedCommerceEntities.reduce((sum, entity) => sum + entity.confidence.score, 0) / normalizedCommerceEntities.length;
  const averageHealth =
    connectorDefinitions.reduce((sum, connector) => sum + connector.healthScore, 0) / connectorDefinitions.length;

  const completeness = Math.max(0, 100 - (missingFieldRows / totalRecords) * 1000);
  const accuracy = (averageConfidence * 0.7) + (averageHealth * 0.3);
  const consistency = Math.max(0, 100 - (failedRecords / totalRecords) * 1200);
  const freshness = Math.max(0, 100 - staleSources * 1.8 - failedSources * 5.4);
  const validity = Math.max(0, (accuracy + consistency) / 2 - failedSources * 1.2);

  const metrics: DataQualityMetric[] = [
    { label: "Completeness", score: roundMetric(completeness), description: "Required marketplace, courier, support, and finance fields are present." },
    { label: "Accuracy", score: roundMetric(accuracy), description: "Entity confidence and connector health agree with source records." },
    { label: "Consistency", score: roundMetric(consistency), description: "Cross-source IDs, dates, amounts, and SKU references align." },
    { label: "Freshness", score: roundMetric(freshness), description: "Sources are inside configured sync windows unless explicitly failed." },
    { label: "Validity", score: roundMetric(validity), description: "Rows pass business validation before reaching the data brain." }
  ];

  const overallScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;

  return {
    overallScore: roundMetric(overallScore),
    duplicateRate: roundRate((failedRecords / totalRecords) * 100),
    missingFieldRate: roundRate((missingFieldRows / totalRecords) * 100),
    parseAccuracy: roundMetric(100 - (failedRecords / totalRecords) * 100),
    metrics,
    missingFields: ["support_messages.order_id", "support_messages.marketplace_sku", "review_exports.parent_asin"],
    warningCount: staleSources + connectorDefinitions.filter((connector) => connector.status === "syncing").length,
    failedSourceCount: failedSources
  };
}

export function getDataQualityMetrics(): DataQualityMetric[] {
  return getDataQualityScorecard().metrics;
}
