// @ts-check
// split-bill.js: the cafe's bill splitter, as it was before the move to TypeScript.

/**
 * How the service was.
 * @enum {string}
 */
export const Service = { POOR: "poor", GOOD: "good", GREAT: "great" };

/** The tip for each kind of service, in percent. */
export const TIP_PERCENT = { poor: 5, good: 10, great: 15 };

/**
 * @typedef {Object} Share
 * @property {string} diner
 * @property {number} cents
 */

/**
 * Adds the tip and splits the bill evenly, each share rounded up to a multiple of roundTo.
 * @param {number} totalCents
 * @param {string[]} diners
 * @param {Service} service
 * @param {number} [roundTo] round each share up to a multiple of this many cents
 * @returns {Share[]}
 */
export function splitBill(totalCents, diners, service, roundTo = 1) {
  if (diners.length === 0) throw new RangeError("nobody to split the bill between");
  const withTip = Math.round((totalCents * (100 + TIP_PERCENT[service])) / 100);
  const each = Math.ceil(withTip / diners.length / roundTo) * roundTo;
  return diners.map((diner) => ({ diner, cents: each }));
}

/**
 * One line per share, in the format the caller chooses.
 * @param {Share[]} shares
 * @param {function(Share): string} format
 * @returns {string}
 */
export function receipt(shares, format) {
  return shares.map((share) => format(share)).join("\n");
}

/**
 * @param {Share[]} shares
 * @returns {number}
 */
export function totalOf(shares) {
  return shares.reduce((sum, share) => sum + share.cents, 0);
}
