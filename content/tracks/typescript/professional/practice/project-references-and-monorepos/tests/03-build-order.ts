import { buildOrder, type Project } from "./solution.js";

function project(folder: string, references: string[], composite = true): Project {
  return { folder, composite, references };
}

const shared = project("packages/shared", []);
const money = project("packages/money", ["packages/shared"]);
const payments = project("packages/payments", ["packages/shared", "packages/money"]);
const stalls = project("apps/stalls", ["packages/payments", "packages/shared"]);
const till = project("apps/till", ["packages/payments"]);
const root = project(".", ["apps/till", "apps/stalls"], false);

check.equal(
  buildOrder([root, shared, money, payments, stalls, till]),
  ["packages/shared", "packages/money", "packages/payments", "apps/till", "apps/stalls", "."],
  "the whole market, walked from the root",
);

const withoutRoot = buildOrder([shared, stalls, till, money, payments]);
check.equal(
  withoutRoot,
  ["packages/shared", "packages/money", "packages/payments", "apps/stalls", "apps/till"],
  "the market without a root, projects taken in the order given",
);

// Whatever the order given, every reference is built before the project that uses it.
const everything = [till, payments, root, money, stalls, shared];
const order = buildOrder(everything);
check.equal(order.length, 6, "every project is built exactly once");
check.equal(new Set(order).size, 6, "no project appears twice");
for (const item of everything) {
  for (const reference of item.references) {
    check.true(order.indexOf(reference) < order.indexOf(item.folder), `${reference} is built before ${item.folder}`);
  }
}
check.equal(order, ["packages/shared", "packages/money", "packages/payments", "apps/till", "apps/stalls", "."], "the order when the till is listed first");

// Small cases.
check.equal(buildOrder([]), [], "no projects");
check.equal(buildOrder([project("packages/shared", [], false)]), ["packages/shared"], "a lone project that nothing references need not be composite");
check.equal(
  buildOrder([project("apps/till", ["packages/shared", "packages/shared"]), shared]),
  ["packages/shared", "apps/till"],
  "a reference listed twice is built once",
);
check.equal(
  buildOrder([project("b", []), project("a", []), project("c", ["a", "b"])]),
  ["b", "a", "c"],
  "independent projects keep the order given",
);
