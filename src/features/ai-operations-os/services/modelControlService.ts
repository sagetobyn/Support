import {
  agentModelConfigs,
  modelProviders,
  promptTemplates
} from "../data/mockSettingsControl";
import type {
  AgentModelConfig,
  ModelControlOverview,
  ModelProviderDefinition,
  PromptTemplateSetting
} from "../domain/types";
import { getAgentRegistry } from "./agentRegistryService";

export function getModelProviders(): ModelProviderDefinition[] {
  return modelProviders;
}

export function getPromptTemplates(): PromptTemplateSetting[] {
  return promptTemplates;
}

export function getAgentModelConfigs(): AgentModelConfig[] {
  return agentModelConfigs;
}

export function getModelControlOverview(): ModelControlOverview {
  const agents = getAgentRegistry();
  const providers = getModelProviders();
  const templates = getPromptTemplates();
  const rows = getAgentModelConfigs().map((config, index) => {
    const agent = agents.find((candidate) => candidate.id === config.agentId);
    const provider = providers.find((candidate) => candidate.id === config.provider) || providers[providers.length - 1];
    const promptTemplate = templates.find((candidate) => candidate.agentId === config.agentId) || templates[0];
    const budgetUseRatio = 0.28 + (index % 4) * 0.08;

    return {
      config,
      agentName: agent?.name || config.agentId,
      agentPurpose: agent?.purpose || "Agent-specific model configuration.",
      provider,
      promptTemplate,
      monthlyBudgetUsedInr: Math.round(config.maxMonthlyBudgetInr * budgetUseRatio),
      estimatedMonthlyCostInr: Math.round(config.maxMonthlyBudgetInr * (budgetUseRatio + 0.12))
    };
  });

  return {
    providers,
    agentRows: rows,
    promptTemplates: templates,
    safeModeCount: rows.filter((row) => row.config.safeMode).length,
    totalMonthlyBudgetInr: rows.reduce((sum, row) => sum + row.config.maxMonthlyBudgetInr, 0),
    configuredProviderCount: providers.filter((provider) => provider.status === "available").length,
    llmCallsEnabled: false
  };
}
