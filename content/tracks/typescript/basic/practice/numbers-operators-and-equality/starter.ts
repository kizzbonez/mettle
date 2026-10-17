// The pay machine of the car park behind the station.
//
// The barrier camera sends how long a car stayed, in minutes, as text, and the
// machine works out the fee in cents. The tests call feeInCents with different
// texts. Lesson 7 explains functions; for now, write only inside the function,
// where it says YOUR CODE, and hand the fee back with `return`.

export function feeInCents(minutesText: string): number {
  // YOUR CODE: replace the throw line below.
  //   1. Turn minutesText into a number with Number(...). Do not use parseInt:
  //      it would read "12px" as 12.
  //   2. The first 15 minutes are free: take 15 off, but never go below 0
  //      (Math.max gives the larger of the numbers you pass it).
  //   3. Each started hour of what is left costs 250 cents: 1 to 60 minutes
  //      is one hour, 61 to 120 minutes is two hours (Math.ceil rounds up).
  //   4. No car pays more than 3000 cents (Math.min gives the smaller).
  // Text that is not a number becomes NaN, and NaN goes through all of this
  // arithmetic and comes out as the fee: that tells the machine to call staff.
  throw new Error("Not implemented");
}
