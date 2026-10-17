Complete `solution.ts`. The starter declares the `brand` symbol and the `ServiceInfo` interface.
Hidden tests check the types with `@ts-expect-error` lines and exact type comparisons, so the
types matter as much as the code.

1. **`Grams`** and **`Cents`** are numbers with a brand, as in the lesson
   (`number & { readonly [brand]: "Grams" }`), so neither a plain number nor the other brand is
   accepted where one of them is expected. Both can still be used as a `number`.
2. **`toGrams(amount: number): Grams`** checks the amount and returns it as `Grams`. A weight is
   a whole number of grams, at least `1` and a safe integer (`Number.isSafeInteger`). Anything
   else throws a `RangeError`. This is the one place the `as Grams` cast belongs.
3. **`SERVICES`** holds the three services: `economy` costs `250` cents per kg and takes `5` days,
   `standard` `400` cents and `3` days, `express` `950` cents and `1` day. Check it against
   `Record<string, ServiceInfo>` with **`as const satisfies`** instead of the starter's
   annotation, so its keys and numbers keep their literal types: `SERVICES.express.days` has the
   type `1`, and its fields are readonly.
4. **`ServiceName`** is derived from `SERVICES`: `"economy" | "standard" | "express"`.
5. **`quote(service: ServiceName, weight: Grams): Cents`** returns the price in cents: every
   started kilogram is charged in full, so 1 to 1000 g costs one kilogram and 1001 g costs two.

Example:

```ts
const parcel = toGrams(1200);
quote("standard", parcel);           // 800: two started kilograms at 400 cents
quote("express", toGrams(1000));     // 950
toGrams(12.5);                       // throws RangeError
quote("standard", 1200);             // compile error: a plain number is not a checked weight
quote("standard", quote("express", parcel)); // compile error: a price is not a weight
quote("overnight", parcel);          // compile error: no such service
```
