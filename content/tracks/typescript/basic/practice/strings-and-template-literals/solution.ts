// The pharmacy's text message for a prescription that is ready to collect.
//
// The tests call pickupMessage with different values. In each call, firstName,
// order and phone hold that call's values: use them like variables, and hand
// your answer back with `return`. Lesson 7 explains functions; for now, write
// only inside the function, where it says YOUR CODE.

export function pickupMessage(firstName: string, order: number, phone: string): string {
  const trimmed = firstName.trim();
  const name = trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1);
  const orderText = String(order).padStart(4, "0");
  const digits = phone.replaceAll(" ", "");
  const masked = digits.slice(-4).padStart(digits.length, "*");
  return `Hi ${name}, order ${orderText} is ready. Reminder sent to ${masked}.`;
}
