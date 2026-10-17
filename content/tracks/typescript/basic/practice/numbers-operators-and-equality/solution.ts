// The pay machine of the car park behind the station.
//
// The barrier camera sends how long a car stayed, in minutes, as text, and the
// machine works out the fee in cents. The tests call feeInCents with different
// texts. Lesson 7 explains functions; for now, write only inside the function,
// where it says YOUR CODE, and hand the fee back with `return`.

export function feeInCents(minutesText: string): number {
  const minutes = Number(minutesText);
  const charged = Math.max(minutes - 15, 0);
  const hours = Math.ceil(charged / 60);
  return Math.min(hours * 250, 3000);
}
