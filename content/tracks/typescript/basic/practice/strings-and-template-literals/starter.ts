// The pharmacy's text message for a prescription that is ready to collect.
//
// The tests call pickupMessage with different values. In each call, firstName,
// order and phone hold that call's values: use them like variables, and hand
// your answer back with `return`. Lesson 7 explains functions; for now, write
// only inside the function, where it says YOUR CODE.

export function pickupMessage(firstName: string, order: number, phone: string): string {
  // YOUR CODE: replace the throw line below with your own lines.
  //   1. name: firstName without spaces around it, and with its first letter
  //      changed to a capital. The rest stays as it was typed.
  //   2. orderText: the order number as text, with zeros in front to make it
  //      4 digits long.
  //   3. digits: the phone number with every space removed.
  //   4. masked: the last 4 digits, with a * in front of them for every
  //      other digit, so that it is as long as digits.
  //   5. return the message, built with one template literal.
  // Strings never change: each method gives back a new string, so keep each
  // result in a const of its own.
  throw new Error("Not implemented");
}
