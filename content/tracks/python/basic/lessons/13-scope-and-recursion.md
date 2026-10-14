---
title: Scope and Recursion
summary: Where a name is visible, local and global scope and the LEGB rule, shadowing and UnboundLocalError, the global statement and why to avoid it, then functions that call themselves, with a base case, on nested data, the recursion limit and RecursionError, and when a loop is the better choice.
minutes: 30
objectives:
  - Explain local, enclosing, global and built-in scope and predict which binding a name refers to
  - Recognise shadowing and fix an UnboundLocalError, preferring parameters and return values to global
  - Write a recursive function with a correct base case, including one that walks nested lists
  - Explain the recursion limit and RecursionError, and choose between recursion and a loop
---

## Outline

1. Local and global scope
2. Shadowing
3. Assigning makes a name local: `UnboundLocalError`
4. `global`, and why to avoid it
5. The LEGB rule
6. Recursion and the base case
7. Recursion on nested data
8. The recursion limit
9. Recursion or a loop?

## Local and global scope

The **scope** of a name is the part of the program where it can be used. A name assigned at the
top level of a file is **global**: it exists from the assignment to the end of the program, and
every function in the file can read it. A name assigned inside a function, including its
parameters, is **local**: it exists only while that call runs, and code outside cannot see it.

```python
greeting = "Hello"


def welcome(name):
    message = f"{greeting}, {name}!"
    return message


print(welcome("Ada"))
print(message)
```

```text
Hello, Ada!
Traceback (most recent call last):
  File "/tmp/a.py", line 10, in <module>
    print(message)
          ^^^^^^^
NameError: name 'message' is not defined
```

`welcome` read the global `greeting` without any declaration. `message` was local to the call and
disappeared when the call returned, so the top level cannot see it. To get a value out of a
function, return it.

## Shadowing

Assigning a name inside a function creates a **new local name**, even when a global of the same
name exists. The local one **shadows** (hides) the global inside the function; the global is not
touched.

```python
count = 10


def reset():
    count = 0
    return count


print(reset(), count)
```

```text
0 10
```

Shadowing is legal but confusing. Give locals their own names. The same goes for built-ins:
a local called `list` or `sum` hides the built-in function inside that function.

## Assigning makes a name local: `UnboundLocalError`

Python decides whether a name is local **when it compiles the function**: if the name is
assigned anywhere in the body, it is local everywhere in the body. That explains a surprising
error:

```python
visits = 0


def record_visit():
    visits += 1


record_visit()
```

```text
Traceback (most recent call last):
  File "/tmp/c.py", line 8, in <module>
    record_visit()
    ~~~~~~~~~~~~^^
  File "/tmp/c.py", line 5, in record_visit
    visits += 1
    ^^^^^^
UnboundLocalError: cannot access local variable 'visits' where it is not associated with a value
```

`visits += 1` assigns, so `visits` is local to `record_visit`. Reading it before the local has a
value fails. Note how the traceback now has two entries: the call at line 8, and inside it the
failing line 5. The bottom one is where the error happened.

## `global`, and why to avoid it

The statement `global name` inside a function says "assignments to this name go to the global
one":

```python
visits = 0


def record_visit():
    global visits
    visits += 1


record_visit()
record_visit()
print(visits)


def add_visit(total):
    return total + 1


hits = 0
hits = add_visit(hits)
hits = add_visit(hits)
print(hits)
```

```text
2
2
```

Both work, but the second is better. A function that changes globals is hard to understand and
test, because its effect depends on, and alters, state outside it. Pass values in as arguments
and get results back with `return`; reach for `global` rarely, if ever.

## The LEGB rule

When Python meets a name, it searches four scopes in order and uses the first binding it finds:

1. **L**ocal: the current function.
2. **E**nclosing: any function the current one is defined inside.
3. **G**lobal: the top level of the file (the module).
4. **B**uilt-in: names Python provides, such as `print`, `len` and `ValueError`.

```python
level = "global"


def outer():
    level = "enclosing"

    def inner():
        return f"inner sees {level}"

    return inner()


print(outer())
print(len("abc"))
```

```text
inner sees enclosing
3
```

`inner` has no local `level`, so Python looks in the enclosing `outer` and finds it there before
reaching the global. `len` is found only at the last stop, the built-ins. If no scope has the
name, you get `NameError`.

## Recursion and the base case

A function may call itself. This is **recursion**, and it suits problems that contain a smaller
copy of themselves. The factorial `n!` is `n × (n - 1)!`, and `1! = 1`:

```python
def factorial(n):
    """Return n! for a whole number n >= 0."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)


print(factorial(5), factorial(0), factorial(20))
```

```text
120 1 2432902008176640000
```

Every recursive function needs two parts:

- a **base case** that answers directly, without recursing (`n <= 1`), and
- a **recursive case** that calls the function on a **smaller** problem (`n - 1`), so the calls
  move towards the base case.

`factorial(3)` calls `factorial(2)`, which calls `factorial(1)`, which returns 1. Then each
waiting call finishes its multiplication: `2 * 1`, then `3 * 2`. Each call has its own local `n`.

## Recursion on nested data

Recursion shines on data that nests to any depth, where a fixed number of loops cannot reach.
`isinstance(item, list)` asks whether `item` is a list:

```python
def total(items):
    """Return the sum of the numbers in items, at any depth of nesting."""
    result = 0
    for item in items:
        if isinstance(item, list):
            result += total(item)
        else:
            result += item
    return result


print(total([1, [2, 3], [4, [5, 6]], []]))
```

```text
21
```

The base case is hidden in the loop: a list with no nested lists makes no recursive call.

## The recursion limit

Every call waiting for an answer occupies memory on the **call stack**. To stop runaway recursion
from crashing the interpreter, CPython limits the depth; `sys.getrecursionlimit()` reports it.
Forget the base case and you hit it:

```python
import sys


def factorial(n):
    return n * factorial(n - 1)


print(sys.getrecursionlimit())
print(factorial(5))
```

```text
1000
Traceback (most recent call last):
  File "/tmp/j.py", line 9, in <module>
    print(factorial(5))
          ~~~~~~~~~^^^
  File "/tmp/j.py", line 5, in factorial
    return n * factorial(n - 1)
               ~~~~~~~~~^^^^^^^
  File "/tmp/j.py", line 5, in factorial
    return n * factorial(n - 1)
               ~~~~~~~~~^^^^^^^
  File "/tmp/j.py", line 5, in factorial
    return n * factorial(n - 1)
               ~~~~~~~~~^^^^^^^
  [Previous line repeated 996 more times]
RecursionError: maximum recursion depth exceeded
```

Without a base case, `n` goes 5, 4, ..., 0, -1, ... forever, until Python raises **`RecursionError`**.
Even a correct `factorial(3000)` fails the same way, because it needs 3000 waiting calls.
`sys.setrecursionlimit` can raise the limit, but setting it too high can crash Python.

## Recursion or a loop?

Anything recursive can be written with a loop, and the other way round.

```python
def factorial_loop(n):
    result = 1
    for k in range(2, n + 1):
        result *= k
    return result


print(factorial_loop(5), factorial_loop(3000) > 10 ** 9000)
```

```text
120 True
```

`factorial_loop(3000)`, a number of more than 9000 digits, is no problem. The loop has no depth limit and is usually faster, so prefer it for simple counting problems like
factorial. Choose recursion when the data itself is recursive, such as nested lists, folders
inside folders, or family trees, where it gives far shorter and clearer code.

## Common mistakes

- **Expecting a function to change a global by assignment.** It creates a local instead, or
  raises `UnboundLocalError`. Return the new value.
- **Using a local after the function returns**: `NameError`.
- **No base case, or a recursive call that does not shrink the problem**: `RecursionError`.
- **Forgetting to `return` the recursive result.** `factorial(n - 1)` without `return n * ...`
  makes the function return `None`.

## Practice

1. What does this print, and why?

   ```python
   x = 5


   def change():
       x = 99
       return x


   print(change(), x)
   ```

2. Write a recursive `power(base, exponent)` for whole-number exponents of 0 or more.
3. Write a recursive `depth(items)` that returns how deeply lists nest: `[1, 2]` has depth 1,
   `[1, [2, [3]]]` depth 3.

### Answers

1. `99 5`. The assignment makes `x` local to `change`; the global `x` is untouched.
2. ```python
   def power(base, exponent):
       if exponent == 0:
           return 1
       return base * power(base, exponent - 1)
   ```

   `power(2, 10)` is 1024 and `power(7, 0)` is 1. The base case is exponent 0.
3. ```python
   def depth(items):
       deepest = 0
       for item in items:
           if isinstance(item, list):
               deepest = max(deepest, depth(item))
       return deepest + 1
   ```

   `depth([1, 2])` is 1, `depth([1, [2, [3]]])` is 3, and `depth([])` is 1.

## Key takeaways

- Names assigned in a function are local; top-level names are global and readable everywhere.
- Python looks names up in Local, Enclosing, Global, then Built-in scope.
- Assigning anywhere in a function makes a name local there; that causes `UnboundLocalError`.
- `global` exists, but parameters and return values are clearer.
- Recursion needs a base case and a smaller recursive call; CPython stops at about 1000 levels
  with `RecursionError`.

## Further reading

- [Tutorial: Python scopes and namespaces](https://docs.python.org/3.15/tutorial/classes.html#python-scopes-and-namespaces)
- [Programming FAQ: rules for local and global variables](https://docs.python.org/3.15/faq/programming.html#what-are-the-rules-for-local-and-global-variables-in-python)
- [Language reference: Naming and binding](https://docs.python.org/3.15/reference/executionmodel.html#naming-and-binding)
- [sys.getrecursionlimit()](https://docs.python.org/3.15/library/sys.html#sys.getrecursionlimit)
