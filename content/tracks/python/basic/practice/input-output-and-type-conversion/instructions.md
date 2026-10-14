Write the whole script this time. The tests run your file and type three lines into it, so read
them with `input()` **without a prompt**: a prompt would be printed and spoil the output.

1. **Read and convert** the three lines, in this order: the bill, a decimal number such as
   `57.60`, read with `float`; the tip in percent, a whole number such as `15`, read with `int`;
   and the number of people sharing, a whole number read with `int`. Do not catch errors: if a
   line cannot be converted, the script stops with the `ValueError` the conversion raises, as in
   the lesson. So a tip of `12.5` or `2.5` people stops the script.
2. **Calculate** the tip (the bill times the percentage, divided by 100), the total (the bill
   plus the tip) and what each person pays (the total divided by the people). Keep the full
   values: round only when you print.
3. **Print** four lines, with every amount shown with two decimals (`:.2f`):
   - the bill, the tip rate and the people, printed by **one** `print` call that is given these
     three parts and `sep=" | "`;
   - `Tip:` and the tip;
   - `Total:` and the total;
   - `Each pays:` and each person's share.

Example: when the tests type `57.60`, `15` and `4`, the script prints:

```text
Bill: 57.60 | Tip rate: 15% | People: 4
Tip: 8.64
Total: 66.24
Each pays: 16.56
```

**Tips.** `float(input())` reads and converts in one step. The first line could be
`print(f"Bill: {bill:.2f}", ..., sep=" | ")`, each part an f-string. `float` accepts spaces around
the number and scientific notation such as `1e2`; `int` accepts spaces but no decimal point.
