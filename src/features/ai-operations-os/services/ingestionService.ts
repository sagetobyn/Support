import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import type { ConnectionStatus, IngestionSource } from "../domain/types";

export function getIngestionOverview() {
  const sources = aiOperationsWorkspace.ingestionSources;
  const failedSources = sources.filter((source) => source.status === "needs_attention").length;
  const syncingSources = sources.filter((source) => source.status === "syncing").length;
  const connectedSources = sources.filter((source) => source.status === "connected").length;
  const totalRecords = sources.reduce((sum, source) => sum + source.recordCount, 0);

  return {
    sources,
    pipeline: aiOperationsWorkspace.ingestionPipeline,
    quality: aiOperationsWorkspace.dataQuality,
    health: {
      connectedSources,
      syncingSources,
      failedSources,
      totalSources: sources.length,
      totalRecords,
      overallStatus: failedSources ? "attention_needed" : ("healthy" as const)
    }
  };
}

export function getConnectorRegistry() {
  const statuses: Record<ConnectionStatus, number> = {
    connected: 0,
    syncing: 0,
    needs_attention: 0,
    not_connected: 0
  };

  aiOperationsWorkspace.ingestionSources.forEach((source) => {
    statuses[source.status] += 1;
  });

  return {
    connectors: aiOperationsWorkspace.ingestionSources.map((source) => ({
      id: source.id,
      label: source.label,
      channel: source.channel,
      supportedInputs: source.supportedInputs,
      status: source.status
    })),
    statuses
  };
}

export function canRetrySource(source: IngestionSource) {
  return source.status === "needs_attention" || source.status === "syncing";
}

