import type { EventHandler, StarterEvent, StarterEventType } from "./types";

const eventStorageKey = "wembro:pro_v1:events";
const previousEventStorageKey = "rtoshield:pro_v1:events";
const subscribers = new Map<StarterEventType | "*", Set<EventHandler>>();
let memoryEvents: StarterEvent[] = [];

function createId(type: StarterEventType) {
  return `evt-${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadEvents() {
  if (!canUseLocalStorage()) return memoryEvents;
  try {
    const stored = window.localStorage.getItem(eventStorageKey) || window.localStorage.getItem(previousEventStorageKey);
    memoryEvents = stored ? (JSON.parse(stored) as StarterEvent[]) : memoryEvents;
  } catch {
    memoryEvents = [];
  }
  return memoryEvents;
}

function saveEvents(events: StarterEvent[]) {
  memoryEvents = events;
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(eventStorageKey, JSON.stringify(events));
}

export function publishEvent<TPayload = Record<string, unknown>>(
  input: Omit<StarterEvent<TPayload>, "id" | "timestamp"> & Partial<Pick<StarterEvent<TPayload>, "id" | "timestamp">>
) {
  const event: StarterEvent<TPayload> = {
    id: input.id || createId(input.type),
    timestamp: input.timestamp || new Date().toISOString(),
    type: input.type,
    sourceFeature: input.sourceFeature,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload
  };
  saveEvents([event as StarterEvent, ...loadEvents()]);
  for (const handler of subscribers.get(event.type) || []) handler(event as StarterEvent);
  for (const handler of subscribers.get("*") || []) handler(event as StarterEvent);
  return event;
}

export function subscribeToEvent(type: StarterEventType | "*", handler: EventHandler) {
  const handlers = subscribers.get(type) || new Set<EventHandler>();
  handlers.add(handler);
  subscribers.set(type, handlers);
  return () => handlers.delete(handler);
}

export function listEvents(type?: StarterEventType) {
  const events = loadEvents();
  return type ? events.filter((event) => event.type === type) : events;
}

export function clearEvents() {
  saveEvents([]);
}
