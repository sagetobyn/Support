"use client";

import { useMemo, useState } from "react";
import {
  applyPromptToConfigPreview,
  parseSellerInstructionToConfig
} from "../services/promptToConfigService";

const exampleInstruction = "Never reduce price below 18% margin and auto-block COD only if RTO risk is above 75%.";

function statusClass(value: string) {
  return `os-pill os-pill-${value.toLowerCase().replaceAll("_", "-")}`;
}

function riskClass(value: string) {
  return `os-risk os-risk-${value}`;
}

export function PromptToConfigPanel() {
  const [instruction, setInstruction] = useState(exampleInstruction);
  const [appliedInstruction, setAppliedInstruction] = useState<string | null>(null);
  const preview = useMemo(() => parseSellerInstructionToConfig(instruction), [instruction]);
  const appliedPreview = appliedInstruction ? applyPromptToConfigPreview(parseSellerInstructionToConfig(appliedInstruction)) : null;

  return (
    <div className="os-prompt-config">
      <label htmlFor="seller-instruction">Seller instruction</label>
      <textarea
        id="seller-instruction"
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={4}
      />
      <div className="os-prompt-config__actions">
        <button type="button" className="os-button" onClick={() => setAppliedInstruction(instruction)}>
          Apply Mock Rules
        </button>
        <span>{preview.parser.replaceAll("_", " ")} · {(preview.confidence * 100).toFixed(0)}% parse confidence</span>
      </div>

      <div className="os-preview-rule-list">
        {preview.rules.map((rule) => (
          <article key={rule.id}>
            <div>
              <strong>{rule.ruleType.replaceAll("_", " ")}</strong>
              <span className={riskClass(rule.riskLevel)}>{rule.riskLevel}</span>
            </div>
            <p>{rule.condition}</p>
            <small>{rule.action}</small>
            <dl>
              <div><dt>Setting</dt><dd>{rule.settingPath}</dd></div>
              <div><dt>Value</dt><dd>{String(rule.parsedValue)}</dd></div>
              <div><dt>Operator</dt><dd>{rule.operator.replaceAll("_", " ")}</dd></div>
              <div><dt>Agents</dt><dd>{rule.affectedAgents.length}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div className="os-rule-preview">
        <span>Mock apply result</span>
        <strong>{appliedPreview ? "Structured rules applied in preview" : "Waiting for seller approval"}</strong>
        <p>{appliedPreview?.auditSummary || preview.auditSummary}</p>
        <div>
          <span className={statusClass(appliedPreview?.applied ? "applied" : "preview")}>
            {appliedPreview?.applied ? "applied" : "preview"}
          </span>
          <span className={statusClass(preview.requiresReview ? "approval_required" : "auto_apply_allowed")}>
            {preview.requiresReview ? "approval required" : "auto apply allowed"}
          </span>
        </div>
      </div>
    </div>
  );
}
