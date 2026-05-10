import { connectorDefinitions, mockConnectorResults } from "../data/mockConnectors";
import type { ConnectionStatus, ConnectorDefinition, MarketplaceChannel } from "../domain/types";

export function getConnectorDefinitions(): ConnectorDefinition[] {
  return connectorDefinitions;
}

export function getMockConnectorResults() {
  return mockConnectorResults;
}

export function getConnectorRegistry() {
  const statuses: Record<ConnectionStatus, number> = {
    connected: 0,
    syncing: 0,
    needs_attention: 0,
    not_connected: 0
  };

  connectorDefinitions.forEach((connector) => {
    statuses[connector.status] += 1;
  });

  const channels = connectorDefinitions.reduce<Partial<Record<MarketplaceChannel, number>>>((counts, connector) => {
    counts[connector.channel] = (counts[connector.channel] || 0) + 1;
    return counts;
  }, {});

  return {
    connectors: connectorDefinitions,
    results: mockConnectorResults,
    statuses,
    channels,
    totalRecordCount: connectorDefinitions.reduce((sum, connector) => sum + connector.recordCount, 0),
    retryableConnectorCount: connectorDefinitions.filter((connector) => connector.canRetry).length
  };
}

export function findConnectorDefinition(connectorId: string) {
  return connectorDefinitions.find((connector) => connector.id === connectorId);
}
