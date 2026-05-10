import { describe, expect, it } from "vitest";
import {
  canRetrySource,
  getConnectorRegistry,
  getDataBrainOverview,
  getDataQualityScorecard,
  getIngestionJobs,
  getIngestionOverview,
  getLineageRecords,
  getMarketplaceIdMappings,
  getNormalizedEntities,
  getSkuMappings,
  getSourceFreshness
} from "@/features/ai-operations-os";

describe("Data ingestion and unified seller data brain foundation", () => {
  it("registers all requested mock connectors with input capabilities", () => {
    const registry = getConnectorRegistry();
    const ids = registry.connectors.map((connector) => connector.id);

    expect(ids).toEqual(expect.arrayContaining([
      "amazon-sp-api",
      "flipkart-seller-api",
      "meesho-supplier-upload",
      "report-upload",
      "courier-reports",
      "bank-statements",
      "support-messages",
      "review-mining",
      "ad-reports"
    ]));
    expect(registry.connectors.find((connector) => connector.id === "report-upload")?.supportedInputs).toEqual(expect.arrayContaining(["csv", "xlsx", "pdf"]));
    expect(registry.connectors.find((connector) => connector.id === "courier-reports")?.supportedInputs).toContain("webhook");
    expect(registry.connectors.every((connector) => connector.capabilities.length > 0)).toBe(true);
  });

  it("rolls up ingestion health, freshness, retry eligibility, and pipeline stages", () => {
    const overview = getIngestionOverview();
    const freshness = getSourceFreshness();
    const jobs = getIngestionJobs();

    expect(overview.health.totalSources).toBe(overview.connectors.length);
    expect(overview.health.totalRecords).toBeGreaterThan(800000);
    expect(overview.pipeline.map((stage) => stage.id)).toEqual(["extracting", "parsing", "cleaning", "normalizing", "validating"]);
    expect(overview.health.failedSources).toBe(freshness.filter((source) => source.status === "failed").length);
    expect(jobs.some((job) => job.status === "failed" && job.nextRetryAt)).toBe(true);
    expect(canRetrySource(overview.connectors.find((connector) => connector.id === "support-messages")!)).toBe(true);
  });

  it("derives data quality from service metrics instead of page constants", () => {
    const quality = getDataQualityScorecard();
    const averageMetricScore = quality.metrics.reduce((sum, metric) => sum + metric.score, 0) / quality.metrics.length;

    expect(quality.overallScore).toBeCloseTo(averageMetricScore, 1);
    expect(quality.parseAccuracy).toBeLessThan(100);
    expect(quality.failedSourceCount).toBeGreaterThan(0);
    expect(quality.missingFields).toEqual(expect.arrayContaining(["support_messages.order_id"]));
  });

  it("normalizes commerce entities with source references and lineage pointers", () => {
    const entities = getNormalizedEntities();
    const order = entities.find((entity) => entity.entityType === "order");
    const supportCase = entities.find((entity) => entity.entityType === "support_case");

    expect(entities.map((entity) => entity.entityType)).toEqual(expect.arrayContaining(["seller", "marketplace_account", "sku", "order", "settlement", "review", "ad_campaign"]));
    expect(order?.sourceRefs[0]?.sourceRecordId).toMatch(/404-/);
    expect(supportCase?.attributes.orderId).toBe("ord-91aa3f");
    expect(entities.every((entity) => entity.lineageIds.length > 0)).toBe(true);
  });

  it("maps SKU and marketplace IDs into canonical IDs with confidence scores", () => {
    const skuMappings = getSkuMappings();
    const marketplaceMappings = getMarketplaceIdMappings();

    expect(skuMappings[0]?.canonicalSkuId).toMatch(/^sku-/);
    expect(skuMappings[0]?.sourceSkuIds.amazon).toBeDefined();
    expect(skuMappings[0]?.confidenceScore).toBeGreaterThan(95);
    expect(marketplaceMappings.find((mapping) => mapping.entityType === "order")?.marketplaceIds).toMatchObject({
      amazon: expect.stringMatching(/^404-/),
      flipkart: expect.stringMatching(/^OD/)
    });
  });

  it("composes page-ready view models for ingestion and data brain routes", () => {
    const ingestion = getIngestionOverview();
    const brain = getDataBrainOverview();
    const lineage = getLineageRecords();

    expect(ingestion.connectors.length).toBeGreaterThanOrEqual(9);
    expect(ingestion.jobs.length).toBeGreaterThan(0);
    expect(ingestion.qualityScorecard.overallScore).toBeGreaterThan(90);
    expect(brain.normalizedPreview.length).toBeGreaterThan(0);
    expect(brain.skuMappings.length).toBeGreaterThan(0);
    expect(brain.marketplaceIdMappings.length).toBeGreaterThan(0);
    expect(brain.lineageRecords.length).toBe(lineage.length);
  });
});
