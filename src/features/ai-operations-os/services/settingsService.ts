import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import {
  appliedStructuredRules,
  automationApprovalRules,
  brandVoiceSettings,
  codRtoRules,
  notificationPreferences,
  profitMarginRules
} from "../data/mockSettingsControl";
import type { SettingsControlOverview } from "../domain/types";
import {
  convertInstructionToRuleDraft,
  parseSellerInstructionToConfig
} from "./promptToConfigService";

const defaultPromptInstruction = "Never reduce price below 18% margin and auto-block COD only if RTO risk is above 75%.";

export function getSellerSettings() {
  return aiOperationsWorkspace.settings;
}

export function getSettingsControlOverview(instruction = defaultPromptInstruction): SettingsControlOverview {
  const settings = getSellerSettings();

  return {
    settings,
    brandVoice: settings.brandVoice || brandVoiceSettings,
    profitMarginRules: settings.profitMarginRules || profitMarginRules,
    codRtoRules: settings.codRtoRules || codRtoRules,
    automationApprovalRules: settings.automationApprovalRules || automationApprovalRules,
    notificationPreferences: settings.notificationPreferences || notificationPreferences,
    promptToConfigPreview: parseSellerInstructionToConfig(instruction),
    appliedRules: settings.appliedStructuredRules || appliedStructuredRules
  };
}

export { convertInstructionToRuleDraft };
