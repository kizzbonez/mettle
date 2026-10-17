// The box office of the Rialto, a small cinema with rows A to J and seats 1 to
// 20 in each row. The cashier types the seats a customer asks for, like "C-12".

export interface Seat {
  row: string;
  number: number;
}

export class SeatError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "SeatError";
    this.code = code;
  }
}

export function parseSeat(code: string): Seat {
  const parts = code.trim().toUpperCase().split("-");
  if (parts.length !== 2) {
    throw new SeatError(`"${code}" is not a seat code`, code);
  }
  const [row, numberText] = parts;
  const seatNumber = Number(numberText);
  if (row.length !== 1 || numberText === "" || !Number.isInteger(seatNumber)) {
    throw new SeatError(`"${code}" is not a seat code`, code);
  }
  if (row < "A" || row > "J" || seatNumber < 1 || seatNumber > 20) {
    throw new RangeError(`there is no seat ${row}-${seatNumber}`);
  }
  return { row, number: seatNumber };
}

export function bookSeats(codes: readonly string[]): string[] {
  const lines: string[] = [];
  for (const code of codes) {
    try {
      const seat = parseSeat(code);
      lines.push(`booked ${seat.row}-${seat.number}`);
    } catch (error) {
      if (error instanceof SeatError) {
        lines.push(`ask again: ${error.message}`);
      } else if (error instanceof RangeError) {
        lines.push(`refused: ${error.message}`);
      } else {
        throw error;
      }
    }
  }
  return lines;
}
