---
title: Functions in Depth
summary: Use the full parameter list of a Python function, from `*args` and `**kwargs` to keyword-only and positional-only parameters, unpack sequences and dictionaries into a call, treat functions as values, write `lambda` expressions, and avoid the trap of defaults that are evaluated once.
minutes: 35
objectives:
  - Collect extra arguments with `*args` and `**kwargs` and explain what types they receive
  - Declare keyword-only and positional-only parameters and predict which calls they reject
  - Unpack a sequence with `*` and a dictionary with `**` into a call, and forward arguments
  - Store, pass and call functions as objects, and write `lambda` expressions where they fit
  - Explain when default values are evaluated and use `None` for mutable defaults
---

## Outline

1. The parameter list in full
2. `*args` and `**kwargs`
3. Keyword-only and positional-only parameters
4. Unpacking arguments at the call
5. Functions are objects
6. `lambda` expressions
7. Default values are evaluated once

## The parameter list in full

The basic course wrote functions with ordinary parameters and defaults, and took a first look at `*args` and `**kwargs`. A Python parameter list can hold five kinds of parameter, always in this order:

```text
def f(pos_only, /, normal, default=0, *args, kw_only, kw_default=1, **kwargs):
```

- before `/`: **positional-only**, passed by position only;
- between `/` and `*`: **positional-or-keyword**, the ordinary kind;
- `*args`: every extra positional argument;
- after `*args` (or a bare `*`): **keyword-only**, passed by name only;
- `**kwargs`: every extra keyword argument.

Few functions need all of them. Each one exists to make a function easier to call correctly.

## `*args` and `**kwargs`

A parameter written `*name` collects the remaining positional arguments into a **tuple**, and `**name` collects the remaining keyword arguments into a **dict**, in the order they were passed. The names `args` and `kwargs` are only a convention:

```python
def label(name, *tags, sep=", ", **details):
    text = f"{name}: {sep.join(tags) or 'no tags'}"
    for key, value in details.items():
        text += f" | {key}={value}"
    return text


print(label("tent"))
print(label("tent", "camping", "outdoor"))
print(label("tent", "camping", "outdoor", sep="/", weight="2.1 kg", colour="green"))
```

```text
tent: no tags
tent: camping, outdoor
tent: camping/outdoor | weight=2.1 kg | colour=green
```

With no extra arguments, `tags` is the empty tuple `()` and `details` the empty dict `{}`, never `None`. Because `sep` comes after `*tags`, it can only be given by name: otherwise `"/"` would simply be one more tag. `print` is defined the same way, `print(*objects, sep=' ', end='\n', ...)`, which is why it takes any number of values.

## Keyword-only and positional-only parameters

A bare `*` makes the parameters after it keyword-only without collecting anything. A `/` makes the parameters before it positional-only:

```python
def brew(tea, /, minutes=3, *, milk=False, sugar=0):
    extras = "with milk" if milk else "black"
    return f"{tea}, {minutes} min, {extras}, {sugar} sugar"


print(brew("assam"))
print(brew("assam", 5, milk=True, sugar=1))
print(brew("green", minutes=2))
```

```text
assam, 3 min, black, 0 sugar
assam, 5 min, with milk, 1 sugar
green, 2 min, black, 0 sugar
```

The calls it refuses, with the messages Python gives:

```text
brew("assam", 5, True)    brew() takes from 1 to 2 positional arguments but 3 were given
brew(tea="green")         brew() got some positional-only arguments passed as keyword arguments: 'tea'
brew()                    brew() missing 1 required positional argument: 'tea'
brew("a", honey=1)        brew() got an unexpected keyword argument 'honey'
brew("a", 4, minutes=5)   brew() got multiple values for argument 'minutes'
```

Why use them:

- **Keyword-only** parameters suit flags and options. `brew("assam", 5, True)` would be unreadable even if allowed: true what? `milk=True` says it.
- **Positional-only** parameters suit arguments whose name means nothing to the caller, such as `len(obj, /)`. The author can rename them later without breaking any call. They also free the name for `**kwargs`: in `def make_tag(name, /, **attributes)`, a caller can pass `name="intro"` as an attribute, which an ordinary `name` parameter would refuse with "got multiple values for argument 'name'".

## Unpacking arguments at the call

At the call, `*` spreads a sequence into positional arguments and `**` spreads a dictionary into keyword arguments. It is the mirror image of `*args` and `**kwargs`:

```python
import math

point = (3, 4)
options = {"sep": " -> ", "end": "!\n"}
print(*point, **options)
print(math.hypot(*point))
settings = {"minutes": 4, "milk": True}
print(brew("rooibos", **settings))


def logged(func, *args, **kwargs):
    print(f"calling {func.__name__} with {args} {kwargs}")
    return func(*args, **kwargs)


print(logged(brew, "assam", milk=True))
```

```text
3 -> 4!
5.0
rooibos, 4 min, with milk, 0 sugar
calling brew with ('assam',) {'milk': True}
assam, 3 min, with milk, 0 sugar
```

(This runs after the definition of `brew` above.) `logged` accepts any arguments and **forwards** them unchanged with `func(*args, **kwargs)`. That pattern is the heart of decorators, in the advanced level. The keys of an unpacked dictionary must be strings that match parameter names.

## Functions are objects

`def` creates a **function object** and binds it to a name, exactly as `=` binds a value. A function can therefore be stored in a variable, a list or a dictionary, passed to another function and returned from one. Python's term is that functions are **first-class**:

```python
def to_fahrenheit(celsius):
    return celsius * 9 / 5 + 32


def to_kelvin(celsius):
    return celsius + 273.15


converters = {"F": to_fahrenheit, "K": to_kelvin}
convert = converters["K"]
print(convert(20), convert.__name__, callable(convert), type(convert).__name__)


def apply_all(functions, value):
    return [function(value) for function in functions]


print(apply_all(converters.values(), 100))
```

```text
293.15 to_kelvin True function
[212.0, 373.15]
```

`converters["K"]` without parentheses is the function itself; with `(20)` it is a call. A dictionary of functions, a **dispatch table**, replaces a long `if`/`elif` chain that picks an action by name. `callable(x)` tells whether `x` can be called.

## `lambda` expressions

`lambda parameters: expression` creates a small function without a name. The body is one expression, whose value is returned; statements such as `if`, `for` or `return` cannot appear in it:

```python
converters["R"] = lambda celsius: (celsius + 273.15) * 9 / 5
print(converters["R"](0), converters["R"].__name__)
print((lambda base, exponent=2: base ** exponent)(5))
print(sorted(["kiwi", "Fig", "banana"], key=lambda word: len(word)))
```

```text
491.66999999999996 <lambda>
25
['Fig', 'kiwi', 'banana']
```

A lambda takes parameters like any function, defaults included. Its natural place is as a short argument to another function, like the sort `key` above, which lesson 6 explains. When you would give it a name, write a `def` instead: PEP 8 discourages `square = lambda n: n * n`, because tracebacks then show `<lambda>` rather than a useful name.

## Default values are evaluated once

A default value is computed **once**, when `def` runs, and the same object is reused by every call that omits the argument:

```python
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


print(add_tag("red"))
print(add_tag("blue"))
print(add_tag.__defaults__)


def add_tag_fixed(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags


print(add_tag_fixed("red"), add_tag_fixed("blue"))
```

```text
['red']
['red', 'blue']
(['red', 'blue'],)
['red'] ['blue']
```

The function keeps its defaults in `__defaults__`, and there the one list keeps growing. The fix is `None` as the default and a new list made inside the call. The same rule means `def with_tax(amount, tax=rate)` captures the value `rate` had when `def` ran; changing `rate` later does not change the default.

## Common mistakes

- **A mutable default** (`[]`, `{}`, `set()`) shared between calls. Use `None`.
- **Calling instead of passing**: `apply_all([to_kelvin()], 5)` raises `TypeError: to_kelvin() missing 1 required positional argument: 'celsius'`. Pass `to_kelvin` without parentheses.
- **Forgetting the stars when forwarding.** `func(args, kwargs)` passes one tuple and one dict as two positional arguments. Write `func(*args, **kwargs)`.
- **Long lambdas.** If it needs a condition and a calculation, write a `def` with a name.

## Practice

1. Write `total(*prices, discount=0)` that returns the sum of the prices less the discount fraction, rounded to 2 decimals. What does `total()` return?
2. Write `make_tag(name, /, **attributes)` so that `make_tag("img", src="cat.png", alt="A cat")` returns `<img src="cat.png" alt="A cat">`.
3. Build a dispatch table `operations` mapping `"+"`, `"-"` and `"*"` to lambdas, and compute 6 times 7 and 10 minus 4 with it.

### Answers

```python
def total(*prices, discount=0):
    return round(sum(prices) * (1 - discount), 2)


def make_tag(name, /, **attributes):
    parts = [name] + [f'{key}="{value}"' for key, value in attributes.items()]
    return "<" + " ".join(parts) + ">"


operations = {"+": lambda a, b: a + b, "-": lambda a, b: a - b, "*": lambda a, b: a * b}
print(total(4.5, 3.0, 6.25), total(4.5, 3.0, 6.25, discount=0.1), total())
print(make_tag("img", src="cat.png", alt="A cat"), make_tag("p", name="intro"))
print(operations["*"](6, 7), operations["-"](10, 4))
```

```text
13.75 12.38 0
<img src="cat.png" alt="A cat"> <p name="intro">
42 6
```

`total()` returns 0, the sum of an empty tuple. Because `name` is positional-only, `make_tag("p", name="intro")` treats `name="intro"` as an attribute.

## Key takeaways

- `*args` gathers extra positional arguments into a tuple and `**kwargs` extra keyword arguments into a dict.
- Parameters after `*` are keyword-only; parameters before `/` are positional-only.
- At a call, `*seq` and `**mapping` unpack values into arguments; `func(*args, **kwargs)` forwards everything.
- Functions are objects: store them, pass them, return them. `lambda` makes a small one inline.
- Defaults are evaluated once at `def` time: use `None` for a mutable default.

## Further reading

- [The Python Tutorial: More on defining functions](https://docs.python.org/3.15/tutorial/controlflow.html#more-on-defining-functions)
- [Language reference: Function definitions](https://docs.python.org/3.15/reference/compound_stmts.html#function-definitions)
- [Glossary: parameter](https://docs.python.org/3.15/glossary.html#term-parameter)
