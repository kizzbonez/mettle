// The hotel's guest Wi-Fi lets guests choose their own password, and rates it
// while they type.
//
// The tests call passwordRating with different passwords. Lesson 7 explains
// functions; for now, write only inside the function, where it says YOUR CODE.

export function passwordRating(password: string): string {
  let digits = 0;
  let capitals = 0;
  let hasSpace = false;

  for (const char of password) {
    // YOUR CODE, part 1: look at char, one character of the password.
    //   - a space " ": set hasSpace to true and leave the loop with break.
    //   - a digit, from "0" to "9": add 1 to digits.
    //   - a capital letter, from "A" to "Z": add 1 to capitals.
  }

  // YOUR CODE, part 2: replace the throw line below with an if, else if and
  // else that returns "invalid", "weak", "fair" or "strong", as the
  // instructions say. Only the first matching block runs, so order matters.
  throw new Error("Not implemented");
}
