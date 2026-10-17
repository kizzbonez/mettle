export interface MotionEvent {
  kind: "motion";
  room: string;
}

export interface DoorEvent {
  kind: "door";
  door: string;
  open: boolean;
}

export interface TemperatureEvent {
  kind: "temperature";
  room: string;
  celsius: number;
}

export interface BatteryEvent {
  kind: "battery";
  device: string;
  percent: number;
}

export interface LeakEvent {
  kind: "leak";
  room: string;
}

export type HomeEvent = MotionEvent | DoorEvent | TemperatureEvent | BatteryEvent | LeakEvent;

export function isTemperature(event: HomeEvent): event is TemperatureEvent {
  return event.kind === "temperature";
}

export function assertDoor(event: HomeEvent): asserts event is DoorEvent {
  if (event.kind !== "door") {
    throw new TypeError(`expected a door event, got ${event.kind}`);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected event: ${JSON.stringify(value)}`);
}

export function describe(event: HomeEvent): string {
  switch (event.kind) {
    case "motion":
      return `motion in the ${event.room}`;
    case "door":
      return `${event.door} door ${event.open ? "opened" : "closed"}`;
    case "temperature":
      return `${event.room} at ${event.celsius} C`;
    case "battery":
      return `${event.device} battery at ${event.percent}%`;
    case "leak":
      return `LEAK in the ${event.room}`;
    default:
      return assertNever(event);
  }
}

export function warmestRoom(events: readonly HomeEvent[]): string | undefined {
  let warmest: TemperatureEvent | undefined;
  for (const reading of events.filter(isTemperature)) {
    if (warmest === undefined || reading.celsius > warmest.celsius) {
      warmest = reading;
    }
  }
  return warmest?.room;
}
