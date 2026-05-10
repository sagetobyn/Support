import { ingestionActivity, ingestionJobs, sourceFreshness } from "../data/mockConnectors";
import type { ConnectorDefinition, IngestionSource, SourceFreshness } from "../domain/types";
import { getConnectorDefinitions, getConnectorRegistry as getRegistry } from "./connectorRegistryService";
import { getDataQualityMetrics, getDataQualityScorecard } from "./dataQualityService";

const pipelineStageLabels = {
  extracting: "Extract",
  parsing: "Parse",
  cleaning: "Clean",
  normalizing: "Normalize",
  validating: "Validate"
} as const;

function toSource(connector: ConnectorDefinition): IngestionSource {
  return {
    id: connector.id,
    label: connector.label,
    channel: connector.channel,
    status: connector.status,
    freshnessLabel: connector.freshnessLabel,
    recordCount: connector.recordCount,
    supportedInputs: connector.supportedInputs
  };
}

export function getIngestionOverview() {
  const connectors = getConnectorDefinitions();
  const sources = connectors.map(toSource);
  const failedSources = sources.filter((source) => source.status === "needs_attention").length;
  const syncingSources = sources.filter((source) => source.status === "syncing").length;
  const connectedSources = sources.filter((source) => source.status === "connected").length;
  const totalRecords = sources.reduce((sum, source) => sum + source.recordCount, 0);
  const pipeline = Object.entries(pipelineStageLabels).map(([stageId, label]) => {
    const matchingStages = ingestionJobs
      .flatMap((job) => job.stages)
      .filter((stage) => stage.id === stageId);
    const hasFailed = matchingStages.some((stage) => stage.status === "failed");
    const hasRunning = matchingStages.some((stage) => stage.status === "running");
    const records = matchingStages.reduce((sum, stage) => sum + stage.recordsProcessed, 0);

    return {
      id: stageId,
      label,
      description: {
        extracting: "Pull from APIs, report files, inboxes, courier feeds, bank files, and ad exports.",
        parsing: "Structure CSV, XLSX, PDF, email, and webhook rows into typed source records.",
        cleaning: "Standardize dates, amounts, identifiers, status names, and marketplace fields.",
        normalizing: "Map source rows into canonical commerce entities and relationship IDs.",
        validating: "Check quality, lineage, required fields, and retry-safe failures before storage."
      }[stageId as keyof typeof pipelineStageLabels],
      status: hasFailed ? "failed" : hasRunning ? "syncing" : "healthy",
      records
    };
  });
  const qualityScorecard = getDataQualityScorecard();

  return {
    sources,
    connectors,
    pipeline,
    quality: getDataQualityMetrics(),
    qualityScorecard,
    jobs: ingestionJobs,
    activity: ingestionActivity,
    freshness: sourceFreshness,
    health: {
      connectedSources,
      syncingSources,
      failedSources,
      totalSources: sources.length,
      totalRecords,
      retryableSources: connectors.filter((connector) => connector.canRetry).length,
      staleSources: sourceFreshness.filter((source) => source.status === "stale").length,
      overallStatus: failedSources ? "attention_needed" : ("healthy" as const)
    }
  };
}

export function getConnectorRegistry() {
  return getRegistry();
}

export function getIngestionJobs() {
  return ingestionJobs;
}

export function getIngestionActivity() {
  return ingestionActivity;
}

export function getSourceFreshness() {
  return sourceFreshness;
}

export function canRetrySource(source: IngestionSource | ConnectorDefinition | SourceFreshness) {
  if ("canRetry" in source) return source.canRetry;
  if ("status" in source && (source.status === "failed" || source.status === "stale")) return true;
  return source.status === "needs_attention" || source.status === "syncing";
}
