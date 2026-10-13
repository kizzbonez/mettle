The editor holds a complete program of the same kind as the first one in the lesson. You
change one line of it. This lab is mostly about finding your way around the workspace: **Run**
tries your code against the visible test and shows its output, and **Submit** runs every test,
including the hidden ones.

1. Press **Run** before you change anything. The test fails, and that is expected. Read the
   result: it shows what the program printed and which line the test wanted instead.
2. Find the line marked `YOUR CODE`. A fourth basket has arrived, and it holds 7 apples. Change
   the list so that it describes all four baskets. Change nothing else, because the program
   works out the number of baskets and the total from the list.
3. Press **Run** again. The program must now print exactly this line:

   ```text
   4 baskets hold 50 apples
   ```

4. Press **Submit**. Three hidden tests look at the same line: the number of baskets, the
   total, and that the rest of the line is as it was.

The tests call `main`, the function that holds the program. The word `pub` in front of `fn` is
what lets them reach it, so leave it there.

**Try it:** delete the word `mut` from the line `let mut total = 0;` and press **Run**. The
program is not built, and you get a compiler error instead. Find the parts that the lesson
described: the error code and summary, the `-->` line with the file, line and column, the
marked code, and the `help` that shows the fix. Then put `mut` back.
