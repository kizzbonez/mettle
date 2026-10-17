// The till of the ice-cream van. All prices are in cents.
//
// Each function below is missing something in its first line as well as its
// body. The instructions give the complete first line of each one.

// Task 1: add a parameter `scoops` with the default value 1, and an optional
// parameter `topping` that holds text. Then write the body.
export function orderLine(flavour: string): string {
  throw new Error("Not implemented");
}

// Task 2: give totalCents a rest parameter `prices`, an array of numbers that
// collects every price it is called with. Then write the body.
export function totalCents(): number {
  throw new Error("Not implemented");
}

// Task 3: add a second parameter `offer`, a function that takes a price in
// cents and returns the new price in cents. Then write the body.
export function priceWithOffer(cents: number): number {
  throw new Error("Not implemented");
}

// Task 4: the first line is complete. Write the body: it returns a function.
export function makeLoyaltyCard(freeEvery: number): () => boolean {
  throw new Error("Not implemented");
}
