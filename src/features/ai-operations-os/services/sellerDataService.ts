import { aiOperationsWorkspace } from "../data/mockOperatingSystem";

export function getSellerProfile() {
  return aiOperationsWorkspace.seller;
}

export function getOnboardingJourney() {
  return {
    seller: aiOperationsWorkspace.seller,
    steps: aiOperationsWorkspace.onboardingSteps,
    connections: aiOperationsWorkspace.connections,
    connectedCount: aiOperationsWorkspace.connections.filter((connection) => connection.status === "connected").length,
    totalConnectionCount: aiOperationsWorkspace.connections.length
  };
}

export function getOperatingMetrics() {
  return aiOperationsWorkspace.metrics;
}

