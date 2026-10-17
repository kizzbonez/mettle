Write the body of `pickupMessage(firstName: string, order: number, phone: string): string`,
where the starter says `YOUR CODE`. It returns one line of text in exactly this form:

```text
Hi <name>, order <order> is ready. Reminder sent to <masked phone>.
```

1. **The name.** Remove spaces, tabs and line breaks around `firstName` (`trim`), then change its
   first letter to a capital and keep the rest as it was typed: `" ada "` gives `Ada`, and
   `"mARIA"` gives `MARIA`. Lesson 4 shows how: a `slice` of the first letter in capitals, joined
   to a `slice` of the rest.
2. **The order number.** Turn `order` into text and add zeros in front until it is 4 digits long
   (`padStart`): 42 gives `0042`. A number that already has 4 digits or more stays as it is.
3. **The masked phone.** Remove every space from `phone` (`replaceAll`). Keep the last 4 digits
   (`slice` with a negative number), and put a `*` in front for every other digit, so that the
   result is as long as the phone number without its spaces (`padStart` again).
4. **The message.** Return the three pieces in one template literal, with the punctuation and
   spaces shown above.

Example:

```ts
pickupMessage("  ada ", 42, "0412 555 019")
// "Hi Ada, order 0042 is ready. Reminder sent to ******5019."
```

`"0412 555 019"` without its spaces is `"0412555019"`, 10 digits long: the last 4 are `5019`,
and 6 stars go in front of them.
