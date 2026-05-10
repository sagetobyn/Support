import { agentInputRequirements, agentRegistry, agentRuns } from "../data/mockAiEngine";
import type { AgentId } from "../domain/types";

export function getAgentRegistry() {
  return agentRegistry;
}

export function getAgentInputRequirements(agentId: AgentId) {
  return agentInputRequirements[agentId];
}

export function getAgentRuns() {
  return agentRuns;
}

export function getAgentById(agentId: AgentId) {
  return agentRegistry.find((agent) => agent.id === agentId);
}
