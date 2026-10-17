Write the two parts of `passwordRating(password: string): string` marked `YOUR CODE`. It returns
one of four words: `"invalid"`, `"weak"`, `"fair"` or `"strong"`.

1. **Part 1, inside the `for...of` loop.** `char` is one character of the password at a time.
   - If it is a space, `" "`, set `hasSpace` to `true` and leave the loop with `break`: the
     password is refused anyway, so there is no need to look further.
   - If it is a digit (`char >= "0" && char <= "9"`, as in lesson 6), add 1 to `digits`.
   - If it is a capital letter (`char >= "A" && char <= "Z"`), add 1 to `capitals`.
2. **Part 2, after the loop.** Replace the `throw` line with an `if`, `else if` and `else` chain
   that applies these rules **in this order**, so that the first one that fits decides:
   1. a password with a space in it is `"invalid"`, whatever else it has;
   2. a password shorter than 8 characters (`password.length < 8`) is `"weak"`;
   3. a password of 12 characters or more, with at least one digit and at least one capital
      letter, is `"strong"`;
   4. any other password is `"fair"`.

Example:

```ts
passwordRating("kiwi12")           // "weak": only 6 characters
passwordRating("sunflower")        // "fair": long enough, but not 12 characters
passwordRating("Sunflower2026!")   // "strong": 14 characters, with digits and a capital
passwordRating("blue moon river")  // "invalid": it has spaces
```
