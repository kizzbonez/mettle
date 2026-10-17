import { validateBooking, type Cone, type ValidationResult } from "./solution.js";

const good = { member: "Ines", pieces: 6, weightKg: 12.5, cone: "6" };

function fieldsOf(body: unknown, what: string): string[] {
  const result = validateBooking(body);
  if (result.ok) fail(`validateBooking refuses ${what}`);
  return result.problems.map((problem) => problem.field);
}

const accepted = validateBooking({ ...good, member: "\tIrena Novak  " });
check.equal(
  accepted,
  { ok: true, booking: { member: "Irena Novak", pieces: 6, weightKg: 12.5, cone: "6" } },
  "a valid body is accepted with the member's name trimmed",
);

for (const body of [null, undefined, [good], "Ines", 42]) {
  check.equal(fieldsOf(body, `the body ${JSON.stringify(body)}`), ["body"], "a body that is not a JSON object is one problem on \"body\"");
}

check.equal(fieldsOf({}, "an empty object"), ["member", "pieces", "weightKg", "cone"], "an empty object misses all four fields, in order");

const badMembers: unknown[] = ["", "   ", "x".repeat(41), 7, null];
for (const member of badMembers) {
  check.equal(fieldsOf({ ...good, member }, `member ${JSON.stringify(member)}`), ["member"], "member must be a name of 1 to 40 characters");
}
check.equal(validateBooking({ ...good, member: "x".repeat(40) }).ok, true, "a member name of exactly 40 characters is allowed");

const badPieces: unknown[] = [0, 21, 2.5, "6", Number.NaN];
for (const pieces of badPieces) {
  check.equal(fieldsOf({ ...good, pieces }, `pieces ${String(pieces)}`), ["pieces"], "pieces must be a whole number from 1 to 20");
}
check.equal(validateBooking({ ...good, pieces: 1 }).ok && validateBooking({ ...good, pieces: 20 }).ok, true, "1 and 20 pieces are allowed");

const badWeights: unknown[] = [0, -1, 25.5, "12", Number.POSITIVE_INFINITY, Number.NaN];
for (const weightKg of badWeights) {
  check.equal(fieldsOf({ ...good, weightKg }, `weightKg ${String(weightKg)}`), ["weightKg"], "weightKg must be above 0 and at most 25");
}
check.equal(validateBooking({ ...good, weightKg: 25 }).ok && validateBooking({ ...good, weightKg: 0.25 }).ok, true, "25 kg and 0.25 kg are allowed");

const badCones: unknown[] = ["5", "6 ", 6, "Cone 6", "006", null];
for (const cone of badCones) {
  check.equal(fieldsOf({ ...good, cone }, `cone ${JSON.stringify(cone)}`), ["cone"], "cone must be exactly one of the four cone strings");
}
for (const cone of ["06", "04", "6", "10"]) {
  check.equal(validateBooking({ ...good, cone }).ok, true, `cone "${cone}" is allowed`);
}

check.equal(
  fieldsOf({ glaze: "celadon", ...good, pieces: 99, paid: true }, "unknown fields"),
  ["pieces", "glaze", "paid"],
  "unknown fields are problems too, after the known fields, in the order they appear",
);

// Type checks only: this function is compiled, never called.
export function typesOnly(result: ValidationResult): Cone {
  // @ts-expect-error "5" is not a cone
  const wrong: Cone = "5";
  // @ts-expect-error the booking is only there once ok has been checked
  const unchecked = result.booking;
  void wrong;
  void unchecked;
  if (!result.ok) {
    // @ts-expect-error a failed result has no booking
    return result.booking.cone;
  }
  return result.booking.cone;
}
