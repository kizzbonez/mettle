// The box office of the Rialto, a small cinema with rows A to J and seats 1 to
// 20 in each row. The cashier types the seats a customer asks for, like "C-12".

export interface Seat {
  row: string;
  number: number;
}

// TODO (task 1): give SeatError a field `code`, the seat code as it was typed,
// set from a second constructor parameter. Set `this.name` to "SeatError".
export class SeatError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function parseSeat(code: string): Seat {
  throw new Error("Not implemented");
}

export function bookSeats(codes: readonly string[]): string[] {
  throw new Error("Not implemented");
}
