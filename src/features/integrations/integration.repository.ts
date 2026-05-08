import prisma from "@/lib/db/prisma";
import type { IntegrationCredentials, IntegrationRecord, IntegrationType } from "./types";

function toRecord(row: {
  id: string;
  brandId: string;
  type: string;
  label: string | null;
  status: string;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  syncedCount: number;
  createdAt: Date;
  updatedAt: Date;
}): IntegrationRecord {
  return {
    id: row.id,
    brandId: row.brandId,
    type: row.type as IntegrationType,
    label: row.label,
    status: row.status as IntegrationRecord["status"],
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: (row.lastSyncStatus as IntegrationRecord["lastSyncStatus"]) ?? null,
    lastSyncError: row.lastSyncError,
    syncedCount: row.syncedCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class IntegrationRepository {
  async listByBrand(brandId: string): Promise<IntegrationRecord[]> {
    const rows = await prisma.integration.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  }

  async getById(brandId: string, id: string): Promise<IntegrationRecord | null> {
    const row = await prisma.integration.findUnique({ where: { id, brandId } });
    return row ? toRecord(row) : null;
  }

  // Returns credentials for server-side adapter use only. Never send to client.
  async getCredentials(brandId: string, id: string): Promise<IntegrationCredentials | null> {
    const row = await prisma.integration.findUnique({ where: { id, brandId }, select: { credentials: true } });
    return row ? (row.credentials as IntegrationCredentials) : null;
  }

  async create(brandId: string, data: {
    type: IntegrationType;
    label?: string;
    credentials: IntegrationCredentials;
  }): Promise<IntegrationRecord> {
    const row = await prisma.integration.create({
      data: {
        brandId,
        type: data.type,
        label: data.label ?? null,
        status: "active",
        credentials: data.credentials as object,
      },
    });
    return toRecord(row);
  }

  async updateStatus(brandId: string, id: string, patch: {
    status?: "active" | "paused" | "error";
    lastSyncAt?: Date;
    lastSyncStatus?: "ok" | "error";
    lastSyncError?: string | null;
    syncedCount?: number;
    credentials?: IntegrationCredentials;
  }): Promise<IntegrationRecord> {
    const row = await prisma.integration.update({
      where: { id, brandId },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.lastSyncAt !== undefined && { lastSyncAt: patch.lastSyncAt }),
        ...(patch.lastSyncStatus !== undefined && { lastSyncStatus: patch.lastSyncStatus }),
        ...(patch.lastSyncError !== undefined && { lastSyncError: patch.lastSyncError }),
        ...(patch.syncedCount !== undefined && { syncedCount: patch.syncedCount }),
        ...(patch.credentials !== undefined && { credentials: patch.credentials as object }),
      },
    });
    return toRecord(row);
  }

  async delete(brandId: string, id: string): Promise<void> {
    await prisma.integration.delete({ where: { id, brandId } });
  }
}
