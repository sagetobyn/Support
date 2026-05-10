import { getDataQualityScorecard } from "./dataQualityService";
import { getLineageRecords } from "./lineageService";
import { getNormalizedEntities } from "./normalizedEntityService";
import { getSourceFreshness } from "./ingestionService";
import type { AgentConfidenceBreakdown, AgentId } from "../domain/types";

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateAgentConfidence({
  agentId,
  findingId,
  entityIds,
  ruleClarity,
  impactClarity
}: {
  agentId: AgentId;
  findingId?: string;
  entityIds: string[];
  ruleClarity: number;
  impactClarity: number;
}): AgentConfidenceBreakdown {
  const quality = getDataQualityScorecard();
  const entities = getNormalizedEntities().filter((entity) => entityIds.includes(entity.id));
  const lineage = getLineageRecords();
  const freshness = getSourceFreshness();
  const lineageEntityIds = new Set(lineage.map((record) => record.entityId));
  const sourceConnectorIds = new Set(entities.flatMap((entity) => entity.sourceRefs.map((source) => source.connectorId)));
  const relevantFreshness = freshness.filter((source) => sourceConnectorIds.has(source.connectorId));

  const entityConfidence =
    entities.length > 0
      ? entities.reduce((sum, entity) => sum + entity.confidence.score, 0) / entities.length
      : 0;
  const lineageCoverage =
    entities.length > 0
      ? (entities.filter((entity) => lineageEntityIds.has(entity.id)).length / entities.length) * 100
      : 0;
  const failedSources = relevantFreshness.filter((source) => source.status === "failed").length;
  const staleSources = relevantFreshness.filter((source) => source.status === "stale").length;
  const sourceFreshness = Math.max(0, 100 - failedSources * 12 - staleSources * 5);

  const finalScore = roundScore(
    quality.overallScore * 0.26 +
      entityConfidence * 0.28 +
      lineageCoverage * 0.16 +
      sourceFreshness * 0.12 +
      ruleClarity * 0.09 +
      impactClarity * 0.09
  );

  const signals = [
    `Data quality ${quality.overallScore.toFixed(1)}%`,
    `Entity confidence ${entityConfidence.toFixed(1)}%`,
    `Lineage coverage ${lineageCoverage.toFixed(1)}%`,
    `Source freshness ${sourceFreshness.toFixed(1)}%`,
    `Rule clarity ${ruleClarity.toFixed(1)}%`,
    `Impact clarity ${impactClarity.toFixed(1)}%`
  ];

  return {
    id: `confidence-${findingId || agentId}`,
    agentId,
    findingId,
    dataQuality: quality.overallScore,
    entityConfidence: roundScore(entityConfidence),
    lineageCoverage: roundScore(lineageCoverage),
    sourceFreshness: roundScore(sourceFreshness),
    ruleClarity,
    impactClarity,
    finalScore,
    signals
  };
}
