// City trips.
assert!(fare_cents(&Trip::City { km: 0 }) == 0, "a city trip of 0 km costs nothing");
assert!(fare_cents(&Trip::City { km: 1 }) == 600, "1 km is the shortest trip at the flat price");
assert!(fare_cents(&Trip::City { km: 3 }) == 600, "3 km is the longest trip at the flat price");
assert!(fare_cents(&Trip::City { km: 4 }) == 750, "the fourth kilometer is the first one charged on top");
assert!(fare_cents(&Trip::City { km: 5 }) == 900, "every kilometer after the third adds the same amount");
assert!(fare_cents(&Trip::City { km: 43 }) == 6600, "a long city trip pays for every kilometer after the third");

// Airport trips.
assert!(fare_cents(&Trip::Airport { terminal: 1, bags: 0 }) == 3500, "terminal 1 has the lower price");
assert!(fare_cents(&Trip::Airport { terminal: 2, bags: 0 }) == 3500, "terminal 2 has the lower price as well");
assert!(fare_cents(&Trip::Airport { terminal: 3, bags: 0 }) == 4200, "terminal 3 has the higher price");
assert!(fare_cents(&Trip::Airport { terminal: 0, bags: 0 }) == 4200, "a terminal numbered 0 is not terminal 1 or 2");
assert!(fare_cents(&Trip::Airport { terminal: 12, bags: 0 }) == 4200, "terminal 12 is not terminal 1 or 2");
assert!(fare_cents(&Trip::Airport { terminal: 1, bags: 1 }) == 3600, "one bag adds the bag charge once");
assert!(
    fare_cents(&Trip::Airport { terminal: 2, bags: 6 }) == 4100,
    "every bag adds the bag charge on a trip at the lower price"
);
assert!(
    fare_cents(&Trip::Airport { terminal: 4, bags: 6 }) == 4800,
    "every bag adds the bag charge on a trip at the higher price"
);

// Waiting.
assert!(fare_cents(&Trip::Waiting(0)) == 0, "no waiting costs nothing");
assert!(fare_cents(&Trip::Waiting(5)) == 0, "the fifth minute is the last free one");
assert!(fare_cents(&Trip::Waiting(6)) == 50, "the sixth minute is the first one charged");
assert!(fare_cents(&Trip::Waiting(7)) == 100, "every minute after the fifth costs the same");
assert!(fare_cents(&Trip::Waiting(59)) == 2700, "59 minutes are charged by the minute");
assert!(fare_cents(&Trip::Waiting(60)) == 2750, "60 minutes are the longest wait charged by the minute");
assert!(fare_cents(&Trip::Waiting(61)) == 2750, "one minute past the hour costs what 60 minutes cost");
assert!(fare_cents(&Trip::Waiting(600)) == 2750, "a very long wait costs what 60 minutes cost");
