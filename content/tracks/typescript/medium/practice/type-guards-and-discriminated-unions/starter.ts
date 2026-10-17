// Smart Home Hub
//
// The four event interfaces and the HomeEvent union are complete, apart from the new leak
// sensor (task 1). Then fix the two return types and write the bodies marked
// `throw new Error("Not implemented")`.

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

// Task 1: add the interface LeakEvent and make it a member of the union.
export type HomeEvent = MotionEvent | DoorEvent | TemperatureEvent | BatteryEvent;

// Task 2: a plain boolean teaches the compiler nothing. Make this a type guard.
export function isTemperature(event: HomeEvent): boolean {
  throw new Error("Not implemented");
}

// Task 3: make this an assertion function.
export function assertDoor(event: HomeEvent): void {
  throw new Error("Not implemented");
}

// Task 4: an exhaustive switch on event.kind.
export function describe(event: HomeEvent): string {
  throw new Error("Not implemented");
}

// Task 5
export function warmestRoom(events: readonly HomeEvent[]): string | undefined {
  throw new Error("Not implemented");
}
