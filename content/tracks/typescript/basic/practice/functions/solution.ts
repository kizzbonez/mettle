// The till of the ice-cream van. All prices are in cents.

export function orderLine(flavour: string, scoops = 1, topping?: string): string {
  const line = `${scoops} x ${flavour}`;
  if (topping === undefined) {
    return line;
  }
  return `${line} with ${topping}`;
}

export function totalCents(...prices: number[]): number {
  let sum = 0;
  for (const price of prices) {
    sum += price;
  }
  return sum;
}

export function priceWithOffer(cents: number, offer: (cents: number) => number): number {
  return Math.max(0, Math.round(offer(cents)));
}

export function makeLoyaltyCard(freeEvery: number): () => boolean {
  let stamps = 0;
  return () => {
    stamps++;
    return stamps % freeEvery === 0;
  };
}
