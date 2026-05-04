import { beforeEach, describe, expect, it } from "vitest";
import { clearEvents, listEvents, publishEvent, subscribeToEvent } from "@/shared/events";

describe("StarterEventBus", () => {
  beforeEach(() => clearEvents());

  it("publishes, lists, subscribes, and clears local events", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeToEvent("csv.imported", (event) => seen.push(event.id));
    const event = publishEvent({
      type: "csv.imported",
      sourceFeature: "imports",
      entityType: "import",
      entityId: "import-1",
      payload: { successCount: 2 }
    });

    expect(seen).toEqual([event.id]);
    expect(listEvents("csv.imported")).toHaveLength(1);
    unsubscribe();
    clearEvents();
    expect(listEvents()).toHaveLength(0);
  });
});

