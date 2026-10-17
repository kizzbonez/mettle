---
title: Classes
summary: Write classes with typed fields, constructors, methods, getters and static members, choose between TypeScript's `private` and JavaScript's `#private`, build hierarchies with `extends`, `super`, `override`, `implements` and abstract classes, and know why parameter properties do not run under Node's type stripping.
minutes: 35
objectives:
  - Declare a class with fields, a constructor, methods, a getter and `readonly` members, and fix error TS2564
  - Explain the difference between `private` (checked by the compiler) and `#private` (enforced at run time)
  - Extend a class with `super` and `override`, implement an interface and use an abstract class
  - Rewrite parameter properties as plain fields so the class runs under Node's type stripping
---

## Outline

1. A first class
2. Fields must be initialized
3. `private`, `protected` and `#private`
4. Static members
5. Inheritance, `super` and `override`
6. `implements` and abstract classes
7. Parameter properties and type stripping

## A first class

A **class** is a template for objects that share a shape and behavior. You declare its
**fields** (the data each object holds), a **constructor** (the function that runs when `new`
creates an object) and **methods** (functions every object can call). Each object made from the
class is an **instance**, and inside the class `this` refers to the instance being used:

```ts
class WaterTank {
  readonly capacity: number;
  level = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  fill(litres: number): number {
    const accepted = Math.min(litres, this.capacity - this.level);
    this.level += accepted;
    return accepted;
  }

  get percentFull(): number {
    return Math.round((this.level / this.capacity) * 100);
  }
}

const tank = new WaterTank(200);
console.log(tank.fill(150), tank.fill(80), tank.percentFull);
console.log(tank);
console.log(typeof WaterTank, tank instanceof WaterTank);
```

```text
150 50 100
WaterTank { capacity: 200, level: 200 }
function true
```

- `level = 0` declares a field with an initial value; its type, `number`, is inferred.
- `readonly capacity` may be assigned in its declaration or the constructor, and nowhere else.
- `get percentFull()` is a **getter**: it is read like a field (`tank.percentFull`, no
  parentheses) but computed each time. A matching `set percentFull(value)` would make it
  assignable; without one it is read-only.
- A class is JavaScript, not just a type: `typeof WaterTank` is `"function"` at run time, and
  `instanceof` checks whether an object was made by it. The class name is also a type, the
  type of its instances.

## Fields must be initialized

With `strict` on, which is the default, every field must get a value in its declaration or in the
constructor. The compiler also enforces `readonly` and getter-only properties:

```ts
class WaterTank {
  readonly capacity: number;
  level: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get percentFull(): number {
    return Math.round((this.level / this.capacity) * 100);
  }
}

const tank = new WaterTank(200);
tank.capacity = 500;
tank.percentFull = 10;
```

```text
main.ts(3,3): error TS2564: Property 'level' has no initializer and is not definitely assigned in the constructor.
main.ts(15,6): error TS2540: Cannot assign to 'capacity' because it is a read-only property.
main.ts(16,6): error TS2540: Cannot assign to 'percentFull' because it is a read-only property.
```

Fix TS2564 by giving the field a value, or make it optional (`level?: number`) if "no value yet"
is a real state. `level!: number` (a **definite assignment assertion**) only silences the check.

## `private`, `protected` and `#private`

Members are `public` by default. TypeScript adds `private` (usable only inside the class) and
`protected` (inside the class and its subclasses). JavaScript itself has a different tool:
a name starting with `#` is a **private element**, hidden by the language at run time.

```ts
class Locker {
  private code: string;
  #pin: string;

  constructor(code: string, pin: string) {
    this.code = code;
    this.#pin = pin;
  }

  opens(pin: string): boolean {
    return pin === this.#pin;
  }
}

const locker = new Locker("B-17", "4821");
console.log(locker.opens("0000"), locker.opens("4821"));
console.log(JSON.stringify(locker));
console.log(locker["code"]);
```

```text
false true
{"code":"B-17"}
B-17
```

Writing `locker.code` or `locker.#pin` outside the class is a compile error either way:

```text
main.ts(19,20): error TS2341: Property 'code' is private and only accessible within class 'Locker'.
main.ts(19,20): error TS18013: Property '#pin' is not accessible outside class 'Locker' because it has a private identifier.
```

But look at the output. `private` exists only in the type checker: after compiling, `code` is an
ordinary property, so `JSON.stringify` includes it and bracket access `locker["code"]` reads it.
The handbook calls this "soft private". `#pin` is "hard private": it is not a property at all,
never appears in `JSON.stringify` or `Object.keys`, and no code outside the class can reach it.
Use `#` for anything that must stay hidden at run time; `private` is fine for marking internal
helpers. `protected` has no `#` equivalent.

## Static members

A `static` member belongs to the class itself, not to its instances, and is used through the class
name: `Alert.count` in the next example. Use it for counters, constants and factory methods.

## Inheritance, `super` and `override`

`class B extends A` makes `B` a **subclass** that inherits everything from `A`. Its constructor
must call `super(...)`, the parent constructor, before using `this`. A subclass may replace a
method; mark that with `override`, and call the parent's version with `super.method()`:

```ts
interface Describable {
  describe(): string;
}

abstract class Alert implements Describable {
  static count = 0;
  readonly recipient: string;

  constructor(recipient: string) {
    this.recipient = recipient;
    Alert.count += 1;
  }

  abstract render(): string;

  describe(): string {
    return `to ${this.recipient}: ${this.render()}`;
  }
}

class SmsAlert extends Alert {
  readonly text: string;

  constructor(recipient: string, text: string) {
    super(recipient);
    this.text = text;
  }

  render(): string {
    return this.text.slice(0, 20);
  }
}

class UrgentSmsAlert extends SmsAlert {
  override render(): string {
    return `URGENT ${super.render()}`;
  }
}

const alerts: Alert[] = [
  new SmsAlert("+351 900 000 001", "Your parcel is at the locker"),
  new UrgentSmsAlert("+351 900 000 002", "Frost tonight, cover the plants"),
];
for (const alert of alerts) {
  console.log(alert.describe());
}
console.log(Alert.count);
```

```text
to +351 900 000 001: Your parcel is at th
to +351 900 000 002: URGENT Frost tonight, cover
2
```

`describe` is written once in `Alert`, yet each object calls its own `render`. `override` protects
you from typos: `override rendr()` is error TS4117, "This member cannot have an 'override'
modifier because it is not declared in the base class 'SmsAlert'. Did you mean 'render'?"

## `implements` and abstract classes

`implements Describable` asks the compiler to check that the class has everything the interface
requires. It only checks; it adds nothing to the class. An **abstract class** is a partial class:
it cannot be instantiated, and its `abstract` members must be written by every concrete subclass.
The compiler holds both to their word:

```ts
interface Describable {
  describe(): string;
}

abstract class Alert {
  abstract render(): string;
}

class Postcard implements Describable {
  text = "Greetings";
}

class BlankAlert extends Alert {}

const alert = new Alert();
```

```text
main.ts(9,7): error TS2420: Class 'Postcard' incorrectly implements interface 'Describable'.
  Property 'describe' is missing in type 'Postcard' but required in type 'Describable'.
main.ts(13,7): error TS2515: Non-abstract class 'BlankAlert' does not implement inherited abstract member render from class 'Alert'.
main.ts(15,15): error TS2511: Cannot create an instance of an abstract class.
```

Choose an interface to describe a shape; choose an abstract class when subclasses should also
share code, like `describe` above.

## Parameter properties and type stripping

TypeScript has a shorthand: a constructor parameter marked `public`, `private`, `protected` or
`readonly` becomes a field automatically.

```ts
class Coordinate {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}
}
```

`tsc` compiles it, but it has to *write new code* to do so (fields and `this.latitude = latitude`
assignments). Node's type stripping only deletes types, so `node coordinate.ts` refuses it:

```text
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

Node.js 26 removed the old `--experimental-transform-types` flag, so there is no switch to turn
this on. Projects that run TypeScript directly set `"erasableSyntaxOnly": true`, which makes `tsc`
report error TS1294, "This syntax is not allowed when 'erasableSyntaxOnly' is enabled", and they
declare the fields explicitly, as `WaterTank` does.

## Common mistakes

- **Using `this` before `super()`** in a subclass constructor: error TS17009. Call `super` first.
- **Treating `private` as security.** It vanishes at run time; `#` does not.
- **Forgetting `new`**: `WaterTank(200)` is error TS2348, because a class cannot be called as a
  function.
- **Silencing TS2564 with `!`** instead of initializing the field, then reading `undefined`.
- **Calling a getter**: `tank.percentFull()` is error TS6234, "This expression is not callable
  because it is a 'get' accessor". Read it without parentheses.

## Practice

1. Write `TallyCounter` with a hard-private count starting at 0, a `readonly label`, an
   `increment()` method, a getter `value`, and a static `created` that counts instances.
2. Rewrite `Coordinate` so that `node coordinate.ts` runs it.
3. In the `Alert` example, what would `new Alert("x")` produce, and why?

### Answers

```ts
class TallyCounter {
  static created = 0;
  #count = 0;
  readonly label: string;

  constructor(label: string) {
    this.label = label;
    TallyCounter.created += 1;
  }

  increment(): void {
    this.#count += 1;
  }

  get value(): number {
    return this.#count;
  }
}

class Coordinate {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

const gate = new TallyCounter("north gate");
gate.increment();
gate.increment();
new TallyCounter("south gate");
console.log(gate.label, gate.value, TallyCounter.created);
console.log(new Coordinate(38.72, -9.14));
```

```text
north gate 2 2
Coordinate { latitude: 38.72, longitude: -9.14 }
```

3. Error TS2511, "Cannot create an instance of an abstract class": `Alert` has no `render`.

## Key takeaways

- A class bundles fields, a constructor and methods; it exists at run time and is also a type.
- Under `strict`, initialize every field. `readonly` and getter-only properties cannot be assigned.
- `private` and `protected` are compile-time checks; `#name` is private at run time.
- `extends` with `super(...)`, `override` for replaced methods, `implements` to check a shape,
  `abstract` for shared partial code.
- Parameter properties need code generation, so Node's type stripping rejects them.

## Further reading

- [TypeScript Handbook: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [MDN: Private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements)
- [MDN: Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [Node.js 26: Modules, TypeScript (type stripping)](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
