import { describe, expect, it } from "vitest";
import { approveAutomationTask, getAutomationInbox, recordAutomationEvent } from "@/features/automation-runtime";
import { GET as getCapabilities } from "@/app/api/v1/automation/capabilities/route";
import { GET as getInbox } from "@/app/api/v1/automation/inbox/route";
import { POST as approveTask } from "@/app/api/v1/automation/tasks/[id]/approve/route";
import { POST as postEvent } from "@/app/api/v1/automation/events/route";

describe("Automation runtime", () => {
  it("returns an exception-first inbox with approvals, failures, and proof", () => {
    const inbox = getAutomationInbox();

    expect(inbox.run.operatingLoop).toEqual(["DATA", "INSIGHT", "DECISION", "ACTION", "LEARNING"]);
    expect(inbox.approvals.length).toBeGreaterThan(0);
    expect(inbox.failures.length).toBeGreaterThan(0);
    expect(inbox.proof.length).toBeGreaterThan(0);
    expect(inbox.summary.moneyProtected).toBeGreaterThan(0);
    expect(inbox.summary.honestAutomationClaims).toBe(0);
  });

  it("approval captures seller control without pretending external execution happened", () => {
    const inbox = getAutomationInbox();
    const task = inbox.approvals[0];
    const approved = approveAutomationTask(task.id);

    expect(approved).toBeDefined();
    expect(approved?.task.status).toBe("approved");
    expect(approved?.event.actor).toBe("seller");
    expect(approved?.event.message).toContain("External execution is still guarded");
  });

  it("records runtime events with task lookup and raw payload proof", () => {
    const task = getAutomationInbox().proof[0];
    const result = recordAutomationEvent({
      taskId: task.id,
      eventType: "learning_recorded",
      actor: "system",
      message: "Outcome improved future priority scoring.",
      rawPayload: { source: "test" }
    });

    expect(result.accepted).toBe(true);
    expect(result.event.rawPayload).toEqual({ source: "test" });
  });
});

describe("Automation API routes", () => {
  it("serves capabilities and inbox without requiring UI scraping", async () => {
    const capabilitiesResponse = await getCapabilities();
    const capabilities = await capabilitiesResponse.json();
    const inboxResponse = await getInbox();
    const inbox = await inboxResponse.json();

    expect(capabilities.summary.totalWorkstreams).toBe(14);
    expect(inbox.summary.todayNeedsSeller).toBeGreaterThan(0);
  });

  it("approves a task and accepts execution events", async () => {
    const inbox = getAutomationInbox();
    const task = inbox.approvals[0];

    const approvalResponse = await approveTask(new Request("http://localhost/api/v1/automation/tasks/test/approve", { method: "POST" }), {
      params: Promise.resolve({ id: task.id })
    });
    const approval = await approvalResponse.json();

    expect(approval.task.status).toBe("approved");

    const eventResponse = await postEvent(new Request("http://localhost/api/v1/automation/events", {
      method: "POST",
      body: JSON.stringify({
        taskId: task.id,
        eventType: "learning_recorded",
        actor: "system",
        message: "API event recorded"
      })
    }));
    const event = await eventResponse.json();

    expect(event.accepted).toBe(true);
    expect(event.event.eventType).toBe("learning_recorded");
  });
});
