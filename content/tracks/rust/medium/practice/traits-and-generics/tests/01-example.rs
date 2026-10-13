// The example from the instructions.
let single = Single { zones: 2, used: false };

assert_eq!(single.price_cents(), 310, "the default price of a single ticket for 2 zones");
assert_eq!(single.label(), "2-zone ticket, 310 cents", "the default label of that single ticket");

// `DayPass` replaces the price. Its label comes from the default method.
assert_eq!(DayPass.price_cents(), 900, "the price of a day pass, which replaces the default");
assert_eq!(DayPass.label(), "4-zone ticket, 900 cents", "the label of a day pass");

assert_eq!(
    total_cents(&[Single { zones: 1, used: false }, Single { zones: 3, used: true }]),
    620,
    "the total of a 1-zone and a 3-zone single ticket"
);

// Two arguments of two different types.
assert_eq!(pass_pays_off(&DayPass, &single, 3), true, "a day pass against 3 rides of 310 cents");
assert_eq!(pass_pays_off(&DayPass, &single, 2), false, "a day pass against 2 rides of 310 cents");

assert_eq!(single.refund_cents(), 210, "the refund for an unused 2-zone single ticket");
